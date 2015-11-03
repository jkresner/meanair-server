### meanair

`meanair` (pronouced "MEAN-er" or "MEAN-air") is a framework for building and
testing node.js web apps.

API docs (soon :p) at => airpair.com/meanair

## meanair.server

### Run it! 

`npm test`

### Overview

This repo is the "magic under the covers" + conventions that make setting 
up a meanair web app so easy. Things you'll find here include:

#### Easy config

Inherit from the meanair default settings and shape your apps config object to 
using the `overrides` object. Then apply differnt values for different contexts 
(dev / test / production) via environtment vars and/or .env files.

#### Powerful instrumentation

Control log output via config to profile your app or watch how users execute 
your code in real-time.

#### Opinionated globals

Libraries like underscore (lodash), moment and a few helper methods we think 
are ok to have accessible all over meanair apps are set in `/lib/index.js`.

#### Handy hooks

Conventions for automatically linking (requiring) code files placed 
in specific folders under `/server` of a meanair app.
