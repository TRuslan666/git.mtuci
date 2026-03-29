from __future__ import annotations

import ast
import difflib
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from itertools import combinations
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment
from app.models.course_enrollment import CourseEnrollment
from app.models.student_repository import StudentRepository
from app.models.user import User
from app.services.gitea_service import GITEA_ADMIN_USERNAME, get_repo_contents, get_repo_file_content


class _VariableNormalizer(ast.NodeTransformer):
    def visit_Name(self, node: ast.Name) -> ast.AST:
        return ast.copy_location(ast.Name(id="VAR", ctx=node.ctx), node)

    def visit_arg(self, node: ast.arg) -> ast.AST:
        return ast.copy_location(ast.arg(arg="VAR", annotation=node.annotation, type_comment=node.type_comment), node)

    def visit_Constant(self, node: ast.Constant) -> ast.AST:
        value = node.value
        if isinstance(value, str):
            return ast.copy_location(ast.Constant(value="STR"), node)
        if isinstance(value, (int, float, complex)) and not isinstance(value, bool):
            return ast.copy_location(ast.Constant(value="NUM"), node)
        return node


@dataclass
class _AstFeatures:
    function_names: set[str]
    operator_names: set[str]
    node_types: set[str]


async def _collect_python_paths(*, owner: str, repo: str, root: str = "") -> list[str]:
    items = await get_repo_contents(owner=owner, repo=repo, filepath=root)
    if not isinstance(items, list):
        return []

    result: list[str] = []
    for item in items:
        item_type = item.get("type")
        item_path = str(item.get("path") or "").strip("/")
        if not item_path:
            continue
        if item_type == "file" and item_path.endswith(".py"):
            result.append(item_path)
        elif item_type == "dir":
            result.extend(await _collect_python_paths(owner=owner, repo=repo, root=item_path))
    return result


async def get_student_code(repo_name: str) -> str:
    """
    Загружает все .py файлы из репозитория и склеивает в один текст.
    """
    paths = await _collect_python_paths(owner=GITEA_ADMIN_USERNAME, repo=repo_name)
    chunks: list[str] = []
    for p in sorted(set(paths)):
        try:
            content = await get_repo_file_content(
                owner=GITEA_ADMIN_USERNAME,
                repo=repo_name,
                filepath=p,
            )
        except RuntimeError:
            continue
        chunks.append(f"# FILE: {p}\n{content}\n")
    return "\n".join(chunks)


def parse_ast_features(code: str) -> _AstFeatures:
    """
    Парсит AST и извлекает имена функций, операторы и типы узлов.
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        # Fallback для частично невалидного кода: всё равно пытаемся извлечь
        # имена функций и использованные операторы.
        function_names = set(re.findall(r"^\s*(?:async\s+def|def)\s+([A-Za-z_]\w*)\s*\(", code, flags=re.MULTILINE))
        operator_tokens = {
            "And": r"\band\b",
            "Or": r"\bor\b",
            "Not": r"\bnot\b",
            "Eq": r"==",
            "NotEq": r"!=",
            "Lt": r"<",
            "LtE": r"<=",
            "Gt": r">",
            "GtE": r">=",
            "Add": r"\+",
            "Sub": r"-",
            "Mult": r"\*",
            "Div": r"/",
            "Mod": r"%",
        }
        operator_names = {name for name, pattern in operator_tokens.items() if re.search(pattern, code)}
        return _AstFeatures(
            function_names=function_names,
            operator_names=operator_names,
            node_types=set(),
        )

    function_names: set[str] = set()
    operator_names: set[str] = set()
    node_types: set[str] = set()

    for node in ast.walk(tree):
        node_types.add(type(node).__name__)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            function_names.add(node.name)
        if isinstance(node, ast.operator):
            operator_names.add(type(node).__name__)
        if isinstance(node, ast.unaryop):
            operator_names.add(type(node).__name__)
        if isinstance(node, ast.boolop):
            operator_names.add(type(node).__name__)
        if isinstance(node, ast.cmpop):
            operator_names.add(type(node).__name__)

    return _AstFeatures(
        function_names=function_names,
        operator_names=operator_names,
        node_types=node_types,
    )


def _jaccard_similarity(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def compare_submissions(code1: str, code2: str) -> dict[str, Any]:
    """
    Возвращает similarity в диапазоне [0, 1] по Jaccard на AST-фичах.
    """
    f1 = parse_ast_features(code1)
    f2 = parse_ast_features(code2)

    nodes_sim = _jaccard_similarity(f1.node_types, f2.node_types)
    funcs_sim = _jaccard_similarity(f1.function_names, f2.function_names)
    ops_sim = _jaccard_similarity(f1.operator_names, f2.operator_names)

    # AST-структура важнее имён.
    score = max(0.0, min(1.0, nodes_sim * 0.7 + funcs_sim * 0.2 + ops_sim * 0.1))

    # Базовое пересечение AST нод.
    common_features = [f"node:{name}" for name in sorted(f1.node_types & f2.node_types)]
    # Если нод нет (или парсинг не дал нод), дополняем функциями и операторами.
    common_features.extend(f"function:{name}" for name in sorted(f1.function_names & f2.function_names))
    common_features.extend(f"operator:{name}" for name in sorted(f1.operator_names & f2.operator_names))

    return {"similarity": score, "common_features": common_features}


def _verdict(similarity: float) -> str:
    if similarity > 0.8:
        return "high"
    if similarity >= 0.6:
        return "medium"
    return "low"


def _compact(s: str) -> str:
    return "".join(s.split())


def _normalize_line_with_ast(line: str) -> str:
    source = line.strip()
    if not source:
        return ""

    parsed: ast.AST | None = None
    parse_candidates = [source]
    if source.endswith(":"):
        parse_candidates.append(f"{source}\n    pass")

    for candidate in parse_candidates:
        for mode in ("exec", "eval"):
            try:
                parsed = ast.parse(candidate, mode=mode)
                break
            except SyntaxError:
                continue
        if parsed is not None:
            break
    if not parsed:
        return _compact(source)

    normalized_tree = _VariableNormalizer().visit(parsed)
    ast.fix_missing_locations(normalized_tree)
    try:
        text = ast.unparse(normalized_tree)
    except Exception:
        text = source
    if source.endswith(":"):
        text = text.replace("\n    pass", "")
    return _compact(text)


def _is_similar_normalized(norm1: str, norm2: str) -> bool:
    if not norm1 or not norm2:
        return False
    ratio = difflib.SequenceMatcher(a=norm1, b=norm2).ratio()
    return ratio >= 0.72


def _status_for_lines(raw1: str, raw2: str) -> str:
    stripped1 = raw1.strip()
    stripped2 = raw2.strip()

    # Пустые строки
    if not stripped1 and not stripped2:
        return "different"

    # Комментарии — сравниваем напрямую
    if stripped1.startswith("#") or stripped2.startswith("#"):
        if _compact(stripped1) == _compact(stripped2):
            return "exact"
        return "different"

    compact1 = _compact(stripped1)
    compact2 = _compact(stripped2)

    # Строки буквально одинаковые (включая имена переменных) -> exact
    if compact1 == compact2:
        return "exact"

    norm1 = _normalize_line_with_ast(stripped1)
    norm2 = _normalize_line_with_ast(stripped2)

    # Нормализованные совпадают (структура одинакова, переменные разные) -> similar
    if norm1 and norm1 == norm2:
        return "similar"

    # Похожи по difflib -> similar
    if _is_similar_normalized(norm1, norm2):
        return "similar"
    return "different"


def _line_score(status: str) -> float:
    if status == "exact":
        return 1.0
    if status == "similar":
        return 0.75
    return 0.0


def _line_similarity(lines: list[dict[str, str]]) -> float:
    if not lines:
        return 1.0
    total_score = sum(_line_score(row.get("status", "different")) for row in lines)
    return max(0.0, min(1.0, total_score / len(lines)))


def line_by_line_compare(code1: str, code2: str) -> dict[str, list[dict[str, str]]]:
    lines1 = code1.splitlines()
    lines2 = code2.splitlines()
    max_len = max(len(lines1), len(lines2))
    result1: list[dict[str, str]] = []
    result2: list[dict[str, str]] = []

    for i in range(max_len):
        raw1 = lines1[i] if i < len(lines1) else ""
        raw2 = lines2[i] if i < len(lines2) else ""
        status = _status_for_lines(raw1, raw2)

        result1.append({"line": raw1, "status": status})
        result2.append({"line": raw2, "status": status})

    return {"lines1": result1, "lines2": result2}


async def compare_students_plagiarism(
    session: AsyncSession,
    *,
    course_id: UUID,
    assignment_id: UUID,
    student1_id: UUID,
    student2_id: UUID,
) -> dict[str, Any]:
    assignment_q = await session.execute(
        select(Assignment).where(
            Assignment.id == assignment_id,
            Assignment.course_id == course_id,
        )
    )
    if not assignment_q.scalar_one_or_none():
        raise ValueError("Assignment not found")

    if student1_id == student2_id:
        raise ValueError("Students must be different")

    students_q = await session.execute(
        select(User)
        .join(CourseEnrollment, CourseEnrollment.student_id == User.id)
        .where(
            CourseEnrollment.course_id == course_id,
            User.id.in_([student1_id, student2_id]),
        )
    )
    students = list(students_q.scalars().all())
    if len(students) != 2:
        raise ValueError("Students must be enrolled in this course")

    repos_q = await session.execute(
        select(StudentRepository).where(
            StudentRepository.assignment_id == assignment_id,
            StudentRepository.student_id.in_([student1_id, student2_id]),
        )
    )
    repos = list(repos_q.scalars().all())
    repo_map = {r.student_id: r.repo_name for r in repos}
    code1 = await get_student_code(repo_map[student1_id]) if student1_id in repo_map else ""
    code2 = await get_student_code(repo_map[student2_id]) if student2_id in repo_map else ""

    comparison = compare_submissions(code1, code2)
    line_comparison = line_by_line_compare(code1, code2)
    score = _line_similarity(line_comparison["lines1"])

    return {
        "similarity": round(score, 4),
        "verdict": _verdict(score),
        "common_features": list(comparison["common_features"]),
        "lines1": line_comparison["lines1"],
        "lines2": line_comparison["lines2"],
    }


async def check_assignment_plagiarism(
    session: AsyncSession,
    *,
    course_id: UUID,
    assignment_id: UUID,
) -> dict[str, Any]:
    assignment_q = await session.execute(
        select(Assignment).where(
            Assignment.id == assignment_id,
            Assignment.course_id == course_id,
        )
    )
    if not assignment_q.scalar_one_or_none():
        raise ValueError("Assignment not found")

    students_q = await session.execute(
        select(User)
        .join(CourseEnrollment, CourseEnrollment.student_id == User.id)
        .where(CourseEnrollment.course_id == course_id)
        .order_by(User.full_name.asc())
    )
    students = list(students_q.scalars().all())

    code_by_student_id: dict[UUID, str] = {}
    repos_q = await session.execute(
        select(StudentRepository).where(StudentRepository.assignment_id == assignment_id)
    )
    repo_map = {repo.student_id: repo.repo_name for repo in repos_q.scalars().all()}
    for student in students:
        repo_name = repo_map.get(student.id)
        code_by_student_id[student.id] = await get_student_code(repo_name) if repo_name else ""

    pairs: list[dict[str, Any]] = []
    for s1, s2 in combinations(students, 2):
        comparison = compare_submissions(
            code_by_student_id.get(s1.id, ""),
            code_by_student_id.get(s2.id, ""),
        )
        score = float(comparison["similarity"])
        if score <= 0.7:
            continue
        pairs.append(
            {
                "student1": {
                    "id": s1.id,
                    "full_name": s1.full_name,
                    "email": s1.email,
                },
                "student2": {
                    "id": s2.id,
                    "full_name": s2.full_name,
                    "email": s2.email,
                },
                "similarity": round(score, 4),
                "verdict": _verdict(score),
            }
        )

    pairs.sort(key=lambda x: x["similarity"], reverse=True)
    return {"pairs": pairs, "checked_at": datetime.now(timezone.utc)}
