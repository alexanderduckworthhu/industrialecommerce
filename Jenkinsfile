pipeline {
  agent any
  triggers {
    pollSCM('H/2 * * * *')
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build') {
      steps {
        sh 'ENV_FILE=.env; [ -f .env ] || ENV_FILE=.env.example; export ENV_FILE; docker compose -f docker-compose.yml --env-file "$ENV_FILE" build'
      }
    }
    stage('Deploy') {
      steps {
        sh 'ENV_FILE=.env; [ -f .env ] || ENV_FILE=.env.example; export ENV_FILE; docker compose -f docker-compose.yml --env-file "$ENV_FILE" up -d --remove-orphans'
      }
    }
    stage('Health Check') {
      steps {
        sh 'curl -sSf http://localhost:3000/health'
        sh 'curl -sSf http://localhost:3000/products'
        sh 'curl -sSf http://localhost:3000/categories'
        sh 'curl -sSf http://localhost:8080/'
        sh 'curl -sSf http://localhost:8080/api/products'
        sh 'curl -sSf http://localhost:8081/'
      }
    }
  }
}