#!/bin/bash

# Terraform Infrastructure Deployment Script
# This script helps deploy the EC2 and RDS infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists terraform; then
        print_error "Terraform is not installed. Please install Terraform first."
        print_status "You can install it with: sudo snap install terraform"
        exit 1
    fi
    
    if ! command_exists aws; then
        print_warning "AWS CLI is not installed. Please install and configure AWS CLI."
        print_status "You can install it with: sudo apt install awscli"
    fi
    
    print_success "Prerequisites check completed"
}

# Initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    terraform init
    print_success "Terraform initialized successfully"
}

# Validate configuration
validate_config() {
    print_status "Validating Terraform configuration..."
    terraform validate
    print_success "Configuration is valid"
}

# Format configuration
format_config() {
    print_status "Formatting Terraform configuration..."
    terraform fmt -recursive
    print_success "Configuration formatted"
}

# Plan deployment
plan_deployment() {
    print_status "Creating deployment plan..."
    terraform plan -out=tfplan
    print_success "Deployment plan created"
}

# Apply deployment
apply_deployment() {
    print_status "Applying deployment..."
    terraform apply tfplan
    print_success "Infrastructure deployed successfully!"
}

# Show outputs
show_outputs() {
    print_status "Infrastructure outputs:"
    terraform output
}

# Main deployment function
deploy() {
    print_status "Starting Terraform infrastructure deployment..."
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found. Creating from example..."
        cp terraform.tfvars.example terraform.tfvars
        print_warning "Please edit terraform.tfvars with your specific values before continuing."
        print_status "Required changes:"
        print_status "  - ec2_key_pair_name: Your AWS key pair name"
        print_status "  - rds_db_password: A secure password for the database"
        print_status "  - aws_region: Your preferred AWS region (if different from us-east-1)"
        read -p "Press Enter after updating terraform.tfvars to continue..."
    fi
    
    check_prerequisites
    init_terraform
    validate_config
    format_config
    plan_deployment
    
    # Ask for confirmation before applying
    echo
    print_warning "This will create AWS resources that may incur charges."
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apply_deployment
        echo
        show_outputs
        print_success "Deployment completed successfully!"
    else
        print_status "Deployment cancelled."
        # Clean up plan file
        rm -f tfplan
    fi
}

# Destroy infrastructure
destroy() {
    print_warning "This will destroy all infrastructure resources!"
    read -p "Are you sure you want to destroy the infrastructure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Destroying infrastructure..."
        terraform destroy
        print_success "Infrastructure destroyed successfully!"
    else
        print_status "Destroy cancelled."
    fi
}

# Show help
show_help() {
    echo "Terraform Infrastructure Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  deploy    Deploy the infrastructure (default)"
    echo "  destroy   Destroy the infrastructure"
    echo "  plan      Show deployment plan only"
    echo "  output    Show current infrastructure outputs"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0                # Deploy infrastructure"
    echo "  $0 deploy         # Deploy infrastructure"
    echo "  $0 plan           # Show deployment plan"
    echo "  $0 destroy        # Destroy infrastructure"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    destroy)
        destroy
        ;;
    plan)
        check_prerequisites
        init_terraform
        validate_config
        format_config
        plan_deployment
        ;;
    output)
        show_outputs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
