/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AutoCodeInspection, Autofix, Fingerprint, goals, PushImpact,} from "@atomist/sdm";
import {Version} from "@atomist/sdm-core";
import {Build} from "@atomist/sdm-pack-build";
import {MavenPerBranchDeployment} from "@atomist/sdm-pack-spring";
import {cfDeployment, cfDeploymentStaging} from "./pcfSupport";

export const autofix = new Autofix();
export const version = new Version();
export const codeInspection = new AutoCodeInspection();
export const fingerprint = new Fingerprint();
export const pushImpact = new PushImpact();

export const build = new Build();

// Just running review and autofix
export const checkGoals = goals("checks")
    .plan(autofix, fingerprint, pushImpact)
    .plan(codeInspection).after(autofix);

export const buildGoals = goals("build")
    .plan(build).after(autofix);

const mavenDeploy = new MavenPerBranchDeployment();

export const localDeploymentGoals = goals("local deploy")
    .plan(mavenDeploy).after(buildGoals);

export const pcfStagingDeploymentGoals = goals("pcf staging")
    .plan(cfDeploymentStaging).after(buildGoals);

export const pcfProductionDeploymentGoals = goals("pcf prod")
    .plan(cfDeployment).after(cfDeploymentStaging);
