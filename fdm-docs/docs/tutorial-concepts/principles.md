## Principles
The FDM is based on the following principles:

1. Information can only be stored in a single place.
2. The fdm object contains only 1 level and does not allow nesting. Information between objects can be connected using id's
3. Names of parameters are based on `pandex`
4. Assets can never be connected by an another asset object, but only via an action. This is also true for an action, an action can only be connected to another action via an asset.
5. Assets names are always plural. Action names always consists out of 2 parts: the first part is the asset on which the action takes place in singular form and the second part the name of the action.
