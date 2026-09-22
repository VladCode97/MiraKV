# Principles

## General Principle of Complexity Reduction

The internal complexity of the system may grow, but the complexity that the user needs to understand should grow as little as possible.

## 1. External Simplicity

The internal complexity of the engine should not be unnecessarily exposed to the user.

## 2. Composition

System capabilities should be composable without introducing a completely new vocabulary for every operation.

## 3. Separation Between Logical and Physical Representation

Logical data representation should not be directly coupled to its binary or physical representation.

## 4. Explicit Decisions

Important architectural decisions should be documented together with their alternatives and trade-offs.

## 5. Workload-Based Adaptation

Internal structures should be able to adapt to observed query behavior.

## 6. Incremental Evolution

Each component should be able to evolve without requiring the entire system to be rebuilt.
