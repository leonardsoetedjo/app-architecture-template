---
name: "Performance Audit Checklist"
type: "ADR"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Performance Audit Checklist

This document provides a set of criteria for auditing code to identify common performance bottlenecks and anti-patterns.

## 1. Database & Persistence

### 1.1 N+1 Query Problem
- **Symptom**: A query is executed for a parent entity, and then N additional queries are executed for each child entity in a loop.
- **Detection**: Check for `@OneToMany` or `@ManyToMany` relationships without specific fetching strategies.
- **Requirement**: Use `JOIN FETCH` in JPQL/HQL or `@EntityGraph` to retrieve related entities in a single query.

### 1.2 In-Memory Filtering
- **Symptom**: Fetching a large dataset from the database and using Java Streams or loops to filter the results.
- **Detection**: Look for `findAll()` followed by `.filter()` or `.stream().filter()`.
- **Requirement**: All filtering, sorting, and aggregation must be performed at the database level using `WHERE`, `ORDER BY`, and `GROUP BY` clauses.

### 1.3 Missing Pagination
- **Symptom**: API endpoints returning lists of entities without a `limit` or `offset`.
- **Detection**: Check for controllers returning `List<Entity>` without taking `Pageable` as a parameter.
- **Requirement**: All list-returning endpoints must implement pagination using Spring Data `Pageable` and return a `Page<T>` response.

### 1.4 Improper Indexing
- **Symptom**: High-frequency queries performing full table scans.
- **Detection**: Use `EXPLAIN ANALYZE` to identify sequential scans on large tables.
- **Requirement**: Ensure all common query filters are supported by B-Tree or GIN indexes. Use partial indexes for filtered datasets.

## 2. Memory & CPU Efficiency

### 2.1 Heavy Object Creation Loops
- **Symptom**: Creating large numbers of short-lived objects inside a tight loop, leading to excessive GC pressure.
- **Detection**: Look for `new` keywords inside loops processing large datasets (e.g., creating DTOs inside a loop of 10k+ items).
- **Requirement**: Reuse objects, use primitive types where appropriate, or process data in chunks.

### 2.2 Nested Loop Complexity
- **Symptom**: Algorithms with $O(n^2)$ or higher complexity.
- **Detection**: Nested `for` or `while` loops where both loop variables iterate over the same or related large collections.
- **Requirement**: Replace nested loops with `Map` lookups ($O(n)$ complexity) or sorted merge joins.

## 3. Concurrency & Reactive Programming

### 3.1 Blocking Calls in Reactive Code
- **Symptom**: Calling a blocking method (e.g., `RestTemplate`, `jdbcTemplate`, `Thread.sleep()`) inside a Project Reactor `Mono` or `Flux` chain.
- **Detection**: Look for blocking calls within `.flatMap()`, `.map()`, or `.doOnNext()`.
- **Requirement**: Use non-blocking alternatives (e.g., `WebClient`, `R2DBC`) or wrap blocking calls in `publishOn(Schedulers.boundedElastic())`.

## 4. Audit Summary Matrix

| Anti-Pattern | Impact | Detection | Resolution |
|--------------|---------|-----------|------------|
| N+1 Queries | High Latency | Logs / Profiler | `JOIN FETCH` / `EntityGraph` |
| In-Memory Filter | High RAM / CPU | Code Review | Move to SQL `WHERE` |
| No Pagination | OOM / Timeout | API Response Size | `Pageable` / `Page<T>` |
| Object Bloat | GC Pressure | Heap Dump / Profiler | Object Reuse / Primitive types |
| Nested Loops | CPU Spike | Big O Analysis | `Map` lookups / Sorting |
| Blocking Reactive | Thread Starvation | Thread Dump | `WebClient` / `boundedElastic` |
