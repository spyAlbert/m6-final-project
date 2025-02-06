# M1: Serialization / Deserialization

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M1 (`hours`) and the lines of code per task.
> My implementation comprises `7` software components, totaling `300` lines of code. Key challenges included `<1. How to support for cycles, specifically, deal with self-recursion : I create a new Type called Reference, after visiting an object or array, keep a map from object to id and when I see such object again, create a reference type with corresponding id rather than object itself. 2. How to support all native functions: I keep a nativeModules which store all modules and functions inside modules, when I see a function, I wll first go through all modules functions to see whether it's a native function, if so , serialize it with type called Native, and store the module name and function name.>`.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation
> _Correctness_: I wrote `8` tests; these tests take `0.234 s` to execute. This includes objects with `Tests for all basic structures including  Number, String, Boolean, null, and undefined, moreover, an extra text for a complex object which contains these  basic structures and 2 additional tests for native functions`.
> _Performance_: The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.
