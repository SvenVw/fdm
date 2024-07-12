# Farm Data Model

This repository contains the schema specification of the Farm Data Model (FDM). The goal of the FDM is to include the information about agronomic relevant activities, assets and insights. 

## Principles
The FDM is based on the following principles:

1. Information can only be stored in a single place.
2. The fdm object contains only 1 level and does not allow nesting. Information between objects can be connected using id's
3. Names of parameters are based on `pandex`
4. Assets can never be connected by an another asset object, but only via an activity. This is also true for an activity, an activity can only be connected to another activity via an asset.
5. Assets names are always plural. Event names always consists out of 2 parts: the first part is the asset on which the event takes place in sungular format and the second part the name of the event.

## Use cases
The FDM can be used to exchange information between multiple parties, but also to be used as input for insights. These insights can contain advices, monitoring and extra information from other sources
