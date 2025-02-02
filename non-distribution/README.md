# M0: Setup & Centralized Computing

> Add your contact information below and in `package.json`.

- name: `<Peiyan Song>`
- email: `<peiyan_song@brown.edu>`
- cslogin: `<psong15>`

## Summary

> Summarize your implementation, including the most challenging aspects; remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete M0 (`40`), the total number of JavaScript lines you added, including tests (`480`), the total number of shell lines you added, including for deployment and testing (`180`).
> My implementation consists of `10` components addressing T1--8. The most challenging aspect was `Implement TF-IDF` because `it's hard to come up with a proper data structure to dynamically update TF-IDF for each term, and it's challenged to combine almost all component in one process and make it work correctly`.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation.
> To characterize correctness, we developed `9` that test the following cases: <stem test with different words, getText getURL test with a real-world html file, and all other tests with new data I came up myself. Moreover, a basic tfidf test in non-distributopn-tfidf directory>.
> _Performance_: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.

## Wild Guess

> How many lines of code do you think it will take to build the fully distributed, scalable version of your search engine? Add that number to the `"dloc"` portion of package.json, and justify your answer below.

Roughly 3000 lines of code. Building a fully distributed search engine need massive infrastructure to handle node communication, scaling, fault tolerance and so on, so it need way more codes than non distributed one.
