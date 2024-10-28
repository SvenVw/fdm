---
sidebar_position: 1
---

# Asset Action Model

`fdm` uses an Asset-Action model to store data at a farm.
In this model, a farm is a collection of assets which are physical things with certain properties such as a field, a soil sample, or a sheep.
Actions are events or processess that affect an asset or take place in or on an asset such as sowing a field, collecting a soil sample, or selling a sheep.
Two objects are never directly linked. Objects are only connected to each other via an action. A stock of fertiliser for instance can only be related to a specific field through a fertilization action.