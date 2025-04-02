# M5: Distributed Execution Engine

## Summary

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M5 (`hours`) and the lines of code per task.
> My implementation comprises `7` new software components, totaling `390` added lines of code over the previous implementation. Key challenges included `The most challenging part was handling data races. In the shuffle phase, when merging content with the same key, using comm.send to get and then put the data could introduce delays, leading to race conditions. To address this, I added an append function that combines the get and put operations into a single atomic step。 `.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation
> _Correctness_: I wrote < 9 > cases testing <differet map-reduce cases, such as word count, sum, avarage, get unqiue words, and also tests for all extra features>.
> _Performance_: My <workflow> can sustain <66.7> <unit>/second, with an average latency of <0.015> seconds per <unit>.

## Key Feature

> Which extra features did you implement and how?

1. compaction

   I passed the compaction function as an argument to the shuffle phase. When retrieving the value list from the map phase, the compactor function is applied first before merging the values for the same key.

2. support for distributed persistence

   To enable persistence, I stored the results in a distributed storage system during the reduce phase.

3. support for optional in-memory operation

   For in-memory operations, I stored intermediate results in mem during the map and shuffle phases.

4. support for iterative MapReduce

   I maintained a counter for the remaining iterations and fed the results from each iteration into the next.
