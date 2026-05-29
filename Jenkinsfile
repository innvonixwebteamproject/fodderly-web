def shellCMD(cmd) {
    steps.sh(script: '#!/bin/bash -e\n' + cmd, returnStdout: true).trim()
}

def node22(cmd) {
    steps.sh(script: '''#!/bin/bash -e
unset PREFIX
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1
''' + cmd, returnStdout: true).trim()
}

@groovy.transform.Field
def REPO_TAG = ''

@groovy.transform.Field
def PREV_REPO_TAG = ''

pipeline {
    agent any
    options {
        timeout(time: 15, unit: 'MINUTES')
    }
    environment {
        PROJECT_NAME = 'fodderly-app-web'
        DOCKER_HUB_USER = 'fodderlydocker'
        DOCKER_IMAGE_NAME = 'fodderly-dev-web'
        DOCKER_CREDENTIALS_ID = 'app-fodderly-docker'
        JENKINS_SSH_KEY_ID = 'jenkins-ssh-key'
        SERVER_HOST = '15.206.203.201'
        SERVER_USER = 'ubuntu'
        SERVER_UPLOAD_PATH = '/home/ubuntu/fodderly.dev.web'
        MATTERMOST_CHANNEL = 'jenkins-deployment'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Login to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    }
                }
            }
        }
        stage('Install & Test') {
            steps {
                script {
                    node22('yarn install --frozen-lockfile')
                    node22('yarn lint')
                }
            }
        }
        stage('Version Release') {
            steps {
                script {
                    PREV_REPO_TAG = shellCMD("bump2version --dry-run --list patch | grep current_version | cut -d '=' -f 2").replaceAll("\\r", "").trim()
                    REPO_TAG = shellCMD("bump2version --dry-run --list patch | grep new_version | cut -d '=' -f 2").replaceAll("\\r", "").trim()
                    echo "Previous version: ${PREV_REPO_TAG}"
                    echo "New version: ${REPO_TAG}"
                    
                    sh "bump2version patch --verbose"
                    // Amend the bump commit
                    sh "git commit --amend --no-edit"
                    
                    // Push everything back to origin
                    withCredentials([sshUserPrivateKey(credentialsId: JENKINS_SSH_KEY_ID, keyFileVariable: 'keyfile')]) {
                        sh """
                        GIT_SSH_COMMAND='ssh -i \${keyfile} -o StrictHostKeyChecking=no' git push origin HEAD:${env.BRANCH_NAME} --tags --force
                        """
                    }
                }
            }
        }
        stage('Build & Push Image') {
            steps {
                script {
                    echo "Building Docker Image: ${DOCKER_HUB_USER}/${DOCKER_IMAGE_NAME}:${REPO_TAG}"
                    
                    withEnv([
                        "REPO_TAG=${REPO_TAG}"
                    ]) {
                        sh "docker compose build"
                        sh "docker compose push"
                    }
                }
            }
        }
        stage('Remote Deployment') {
            steps {
                script {
                    withCredentials([
                        sshUserPrivateKey(
                            credentialsId: JENKINS_SSH_KEY_ID,
                            keyFileVariable: 'keyfile'
                        )
                    ]) {
                        // Upload / replace docker-compose.yml
                        sh """
                        scp -i ${keyfile} -o StrictHostKeyChecking=no \
                        docker-compose.yml \
                        ${SERVER_USER}@${SERVER_HOST}:${SERVER_UPLOAD_PATH}/docker-compose.yml
                        """

                        // Pull latest images and start containers
                        sh """
                        ssh -i ${keyfile} -o StrictHostKeyChecking=no \
                        ${SERVER_USER}@${SERVER_HOST} '
                            cd ${SERVER_UPLOAD_PATH} &&
                            docker compose pull &&
                            docker compose up -d &&
                            docker image prune -f --filter "label=project=fodderly-app-web"
                        '
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            script {
                // Do clean up. 
                echo "Pipeline finished"
                echo "Cleaning workspace"
                dir("${env.WORKSPACE}@tmp") {
                    deleteDir()
                }
                dir("${env.WORKSPACE}@script") {
                    deleteDir()
                }
                dir("${env.WORKSPACE}@script@tmp") {
                    deleteDir()
                }
            }
        }
        success {
            script {
                echo "Build succeeded, finishing up"
                if(env.MATTERMOST_CHANNEL){
                    mattermostSend color: 'good', text: '@here', message: "Jenkins build pipeline succeeded for $PROJECT_NAME", channel: "$MATTERMOST_CHANNEL"
                }
            }
        }
        failure {
            script{
                echo "Build failed"
                if(env.MATTERMOST_CHANNEL){
                    mattermostSend color: 'bad', text: '@here', message: "Jenkins build pipeline failed for $PROJECT_NAME", channel: "$MATTERMOST_CHANNEL"
                }
            }
        }
    }
}