---
title: Prerequisites
---

This guide provides a comprehensive walkthrough on how to create a farm using `fdm-core`, the core library of the Farm Data Model (FDM). It covers the necessary steps, code examples, and explanations to help you get started.

## Prerequisites

Before you begin, ensure you have the following:

* **PostgreSQL Database:**  `fdm-core` uses a PostgreSQL-compatible database. Make sure you have a running PostgreSQL instance and the necessary credentials and enabled the `PostGIS` extenstion.
* **fdm-core installed:** Install `fdm-core` in your project using `pnpm install @svenvw/fdm-core`.
* **Database Connection:** Configure the database connection in your `.env` file as per the `fdm-core` documentation.
