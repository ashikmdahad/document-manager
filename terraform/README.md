# Terraform Infrastructure - EC2 and RDS

This Terraform configuration creates a modularized infrastructure on AWS that includes:

- EC2 instance with configurable security groups and storage
- RDS database instance with backup and monitoring capabilities
- All resources deployed in the default VPC

## Architecture

```
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example variable values
├── modules/
│   ├── ec2/
│   │   ├── main.tf           # EC2 resources
│   │   ├── variables.tf      # EC2 module variables
│   │   └── outputs.tf        # EC2 module outputs
│   └── rds/
│       ├── main.tf           # RDS resources
│       ├── variables.tf      # RDS module variables
│       └── outputs.tf        # RDS module outputs
```

## Features

### EC2 Module

- Configurable instance type, AMI, and key pair
- Customizable security group rules
- Configurable root volume size and type
- Optional Elastic IP association
- Encrypted storage by default

### RDS Module

- Support for multiple database engines (MySQL, PostgreSQL, etc.)
- Configurable instance class and storage
- Automated backups with configurable retention
- Enhanced monitoring support
- Performance Insights (optional)
- Encrypted storage by default
- Custom parameter groups (optional)

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform installed** (version >= 1.0)
3. **AWS Key Pair** created for EC2 access

## Quick Start

1. **Clone and navigate to the terraform directory:**

   ```bash
   cd terraform
   ```

2. **Copy the example variables file:**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit terraform.tfvars with your specific values:**

   ```bash
   # Required: Update these values
   ec2_key_pair_name = "your-key-pair-name"
   rds_db_password   = "YourSecurePassword123!"

   # Optional: Customize other values as needed
   aws_region        = "us-east-1"
   ec2_instance_type = "t3.micro"
   rds_db_instance_class = "db.t3.micro"
   ```

4. **Initialize Terraform:**

   ```bash
   terraform init
   ```

5. **Plan the deployment:**

   ```bash
   terraform plan
   ```

6. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Configuration Options

### EC2 Customization

You can modify the following EC2 parameters in `terraform.tfvars`:

```hcl
# Instance Configuration
ec2_instance_type = "t3.small"    # t3.micro, t3.small, t3.medium, etc.
ec2_volume_size   = 30            # Root volume size in GB
ec2_volume_type   = "gp3"         # gp2, gp3, io1, io2

# Security Group Rules
ec2_security_group_rules = {
  ingress = [
    {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["YOUR_IP/32"]  # Restrict SSH to your IP
      description = "SSH access"
    },
    {
      from_port   = 8080
      to_port     = 8080
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Application port"
    }
  ]
  egress = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      description = "All outbound traffic"
    }
  ]
}
```

### RDS Customization

You can modify the following RDS parameters in `terraform.tfvars`:

```hcl
# Database Configuration
rds_db_engine         = "postgres"     # mysql, postgres, mariadb
rds_db_engine_version = "13.7"
rds_db_instance_class = "db.t3.small"  # db.t3.micro, db.t3.small, etc.
rds_allocated_storage = 50             # Storage in GB
rds_storage_type      = "gp3"          # gp2, gp3, io1

# Backup Configuration
rds_backup_retention_period = 14       # Days to retain backups
rds_backup_window          = "03:00-04:00"
rds_maintenance_window     = "sun:04:00-sun:05:00"
```

## Security Best Practices

1. **Restrict SSH access** to your IP address only
2. **Use strong passwords** for RDS instances
3. **Enable encryption** for both EC2 and RDS storage (enabled by default)
4. **Regularly update** AMI IDs to use latest patches
5. **Use IAM roles** instead of hardcoded credentials

## Outputs

After successful deployment, Terraform will output:

- EC2 instance details (ID, IP addresses, DNS names)
- RDS instance details (endpoint, port, database name)
- Security group IDs
- SSH connection command
- Database connection string template

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Troubleshooting

### Common Issues

1. **Key pair not found**: Ensure the key pair exists in the specified AWS region
2. **Insufficient permissions**: Verify AWS credentials have necessary permissions
3. **Resource limits**: Check AWS service limits for EC2 and RDS instances
4. **Subnet availability**: Ensure default VPC has subnets in multiple AZs

### Useful Commands

```bash
# Check current state
terraform show

# List all resources
terraform state list

# Get specific resource details
terraform state show module.ec2.aws_instance.main

# Refresh state
terraform refresh

# Format configuration files
terraform fmt -recursive
```

## Advanced Configuration

### Using Different Regions

To deploy in a different region, update the AMI ID for that region:

```hcl
# For us-west-2
ec2_ami_id = "ami-0c2d3e23f757b5d84"  # Amazon Linux 2 in us-west-2
```

### Adding Custom User Data

You can add user data to the EC2 instance by modifying the module call in `main.tf`:

```hcl
module "ec2" {
  source = "./modules/ec2"

  # ... other variables ...

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    EOF
  )
}
```

## Contributing

1. Follow Terraform best practices
2. Update documentation for any new features
3. Test changes in a development environment first
4. Use meaningful commit messages

## License

This project is licensed under the MIT License.
