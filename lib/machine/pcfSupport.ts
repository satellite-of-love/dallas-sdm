import {CloudFoundryDeploy, CloudFoundryDeploymentStrategy} from "@atomist/sdm-pack-cloudfoundry";

export const cfDeployment = new CloudFoundryDeploy({
    displayName: "Deploy to CF `production`",
    environment: "production",
    preApproval: true,
    descriptions: {
        inProcess: "Deploying to Cloud Foundry `production`",
        completed: "Deployed to Cloud Foundry `production`",
    },
})
    .with({ environment: "production", strategy: CloudFoundryDeploymentStrategy.API });

export const cfDeploymentStaging = new CloudFoundryDeploy({
        displayName: "Deploy to CF `testing`",
        environment: "testing",
        preApproval: true,
        descriptions: {
            inProcess: "Deploying to Cloud Foundry `testing`",
            completed: "Deployed to Cloud Foundry `testing`",
        },
    },
)
    .with({ environment: "staging", strategy: CloudFoundryDeploymentStrategy.API });
