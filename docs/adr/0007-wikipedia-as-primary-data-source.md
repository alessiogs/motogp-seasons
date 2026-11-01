# Wikipedia is the primary data source; motogp.com only for checking

There is no official public results API. motogp.com's legal notice forbids copying or transmitting its Content "whether for profit or free of charge", and its undocumented API has thin data before the modern era (1949 Results carry no points). Wikipedia's results are CC BY-SA 4.0, so Results are loaded from Wikipedia, the published data is licensed CC BY-SA with an attribution page on the site, and motogp.com is used only to verify data by hand, never scraped into the dataset. Every Result keeps its source.

## Consequences

- Derived data published from this repo inherits CC BY-SA (share-alike).
- Wikipedia coverage gaps (aggregate races, half points, stripped results) must be checked Season by Season before publishing.
