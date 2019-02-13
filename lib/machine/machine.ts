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

import {
    AnyPush,
    AutoCodeInspection,
    Autofix,
    CodeTransform,
    Fingerprint,
    goals,
    ImmaterialGoals,
    isMaterialChange,
    not,
    PushImpact,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineConfiguration,
    ToDefaultBranch,
    whenPushSatisfies,
} from "@atomist/sdm";
import { createSoftwareDeliveryMachine, gitHubGoalStatus, goalState } from "@atomist/sdm-core";
import { Build, buildAwareCodeTransforms } from "@atomist/sdm-pack-build";
import { CloudFoundrySupport, HasCloudFoundryManifest } from "@atomist/sdm-pack-cloudfoundry";
import { IssueSupport } from "@atomist/sdm-pack-issue";
import { HasSpringBootPom, IsMaven, MavenPerBranchDeployment } from "@atomist/sdm-pack-spring";
import { cfDeployment, cfDeploymentStaging } from "./pcfSupport";
import { addSpringSupport } from "./springSupport";

export function machine(configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {
    const autofixGoal = new Autofix();
    const inspectGoal = new AutoCodeInspection();
    const fingerprintGoal = new Fingerprint();
    const pushImpactGoal = new PushImpact();

    const buildGoal = new Build();

    // Just running review and autofix
    const checkGoals = goals("checks")
        .plan(autofixGoal, fingerprintGoal, pushImpactGoal)
        .plan(inspectGoal).after(autofixGoal);

    const buildGoals = goals("build")
        .plan(buildGoal).after(autofixGoal);

    const mavenDeploy = new MavenPerBranchDeployment();

    const localDeploymentGoals = goals("local deploy")
        .plan(mavenDeploy).after(buildGoals);

    const pcfStagingDeploymentGoals = goals("pcf staging")
        .plan(cfDeploymentStaging).after(buildGoals);

    const pcfProductionDeploymentGoals = goals("pcf prod")
        .plan(cfDeployment).after(cfDeploymentStaging);

    const sdm = createSoftwareDeliveryMachine({
        name: "Spring/PCF Demo Software Delivery Machine",
        configuration,
    },
    );

    sdm.withPushRules(
        whenPushSatisfies(AnyPush).setGoals(checkGoals),
        whenPushSatisfies(not(isMaterialChange({
            extensions: ["java", "html", "json", "yml", "xml", "sh", "kt", "properties"],
            files: ["Dockerfile"],
            directories: [".atomist", ".github"],
        }))).setGoals(ImmaterialGoals.andLock()),
        whenPushSatisfies(IsMaven).setGoals(buildGoals),
        // whenPushSatisfies(IsMaven, HasDockerfile).setGoals(dockerGoals),
        whenPushSatisfies(HasSpringBootPom, ToDefaultBranch)
            .setGoals(localDeploymentGoals),
        whenPushSatisfies(HasSpringBootPom, ToDefaultBranch, HasCloudFoundryManifest)
            .setGoals(pcfStagingDeploymentGoals),
        whenPushSatisfies(HasSpringBootPom, ToDefaultBranch, HasCloudFoundryManifest)
            .setGoals(pcfProductionDeploymentGoals),
    );

    addSpringSupport(sdm, { autofixGoal, buildGoal, inspectGoal });

    sdm.addCodeTransformCommand<{ message: string }>({
        name: "warningFile",
        intent: "warn them",
        parameters: {
            message: { description: "warning message", maxLength: 100 },
        },
        transform: async (p, invocation) => {
            const warningFile = "WARNING.md";
            invocation.addressChannels("I will warn them that " + invocation.parameters.message);
            if (await p.hasFile(warningFile)) {
                await p.deleteFile(warningFile);
            }
            await p.addFile(warningFile, invocation.parameters.message);
        },
    });

    // Brings in add cloud foundry manifest
    sdm.addExtensionPacks(CloudFoundrySupport({}));

    // sdm.addGoalApprovalRequestVoter(githubTeamVoter());
    sdm.addExtensionPacks(
        buildAwareCodeTransforms({
            buildGoal,
            issueCreation: {
                issueRouter: {
                    raiseIssue: async () => {
                        // raise no issues
                    },
                },
            },
        }),
        IssueSupport,
        goalState(),
        gitHubGoalStatus());

    return sdm;
}
