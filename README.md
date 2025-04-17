# M6: Distributed Execution Engine

## Summarize the process of writing the paper and preparing the poster, including any surprises you encountered.

Writing the paper and preparing the poster was a surprisingly challenging yet rewarding process. One major surprise was how difficult it was to fit the full scope of our system into the paper's length constraints—we often had to distill complex design decisions into just a few sentences. Along the way, we encountered unexpected obstacles, including redesigning key parts like the crawler’s rate limiting and handling cyclic dependencies in the graph. While frustrating at first, these led to a more robust and efficient final system.
The writing process itself was highly iterative. We often found ourselves refining explanations after seeing how difficult certain ideas were to convey clearly. Interestingly, this sometimes made us revisit and simplify our code to better align with our explanations. We also learned the importance of writing with our audience in mind—while we were deep in the world of distributed systems, we had to make sure our writing was accessible and clear to readers who might not share the same technical background.

## Roughly, how many hours did M6 take you to complete?

Hours: <40>

## How many LoC did the distributed version of the project end up taking?

DLoC: <3500>

## How does this number compare with your non-distributed version?

LoC: <480>

## How different are these numbers for different members in the team and why?

Interestingly, the number of lines of code written by each team member varied less than expected. While one might assume components like the crawler could require more code, our crawler was relatively concise, leveraging the existing MapReduce framework.
In contrast, other parts of the system—such as the query engine and PageRank pipeline—required more lines of code due to their logic-heavy design. The query engine, for example, handled ranking, spellchecking, and scoring logic, while the PageRank implementation involved iterative computation and tuning convergence behavior. Overall, the variation in LoC came down more to the nature of each component’s logic than the raw complexity of distributed execution, since the shared infrastructure handled much of the heavy lifting.
