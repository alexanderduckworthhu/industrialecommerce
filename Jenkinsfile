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
        sh 'docker compose -f docker-compose.yml --env-file .env build'
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker compose -f docker-compose.yml --env-file .env up -d --remove-orphans'
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