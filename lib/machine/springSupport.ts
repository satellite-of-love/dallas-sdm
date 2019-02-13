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

import { GitHubRepoRef, } from "@atomist/automation-client";
import { SoftwareDeliveryMachine } from "@atomist/sdm";
import { isInLocalMode } from "@atomist/sdm-core";
import { singleIssuePerCategoryManaging } from "@atomist/sdm-pack-issue";
import {
    mavenBuilder,
    ReplaceReadmeTitle,
    SetAtomistTeamInApplicationYml,
    SpringProjectCreationParameterDefinitions,
    SpringProjectCreationParameters,
    springSupport,
    TransformSeedToCustomProject,
} from "@atomist/sdm-pack-spring";
import { autofix, build, codeInspection } from "./goals";
import { MavenDefaultOptions } from "./maven";

export function addSpringSupport(sdm: SoftwareDeliveryMachine) {

    build.with({
        ...MavenDefaultOptions,
        builder: mavenBuilder(),
    });

    sdm.addGeneratorCommand<SpringProjectCreationParameters>({
        name: "create-spring",
        intent: "create spring",
        description: "Create a new Java Spring Boot REST service",
        parameters: SpringProjectCreationParameterDefinitions,
        startingPoint: GitHubRepoRef.from({
            owner: "satellite-of-love",
            repo: "spring-rest-seed", branch: "master"
        }),
        transform: [
            ReplaceReadmeTitle,
            SetAtomistTeamInApplicationYml,
            TransformSeedToCustomProject,
        ],
    });

    sdm.addExtensionPacks(springSupport({
        inspectGoal: codeInspection,
        autofixGoal: autofix,
        review: {
            cloudNative: true,
            springStyle: true,
        },
        autofix: {
            springStyle: true,
            cloudNative: true,
        },
        springFormat: true,
        reviewListeners: isInLocalMode() ? [] : [
            singleIssuePerCategoryManaging("sdm-pack-spring"),
        ],
    }));
}
