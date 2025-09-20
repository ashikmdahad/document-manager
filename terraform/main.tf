terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source to get default VPC
data "aws_vpc" "default" {
  default = true
}

# Data source to get default subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Data source to get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"

  instance_name         = var.ec2_instance_name
  instance_type        = var.ec2_instance_type
  ami_id              = var.ec2_ami_id
  key_pair_name       = var.ec2_key_pair_name
  vpc_id              = data.aws_vpc.default.id
  subnet_id           = data.aws_subnets.default.ids[0]
  volume_size         = var.ec2_volume_size
  volume_type         = var.ec2_volume_type
  security_group_rules = var.ec2_security_group_rules
  
  tags = var.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  db_identifier           = var.rds_db_identifier
  db_name                = var.rds_db_name
  db_username            = var.rds_db_username
  db_password            = var.rds_db_password
  db_instance_class      = var.rds_db_instance_class
  db_engine              = var.rds_db_engine
  db_engine_version      = var.rds_db_engine_version
  allocated_storage      = var.rds_allocated_storage
  storage_type           = var.rds_storage_type
  storage_encrypted      = var.rds_storage_encrypted
  vpc_id                 = data.aws_vpc.default.id
  subnet_ids             = data.aws_subnets.default.ids
  availability_zones     = data.aws_availability_zones.available.names
  security_group_rules   = var.rds_security_group_rules
  backup_retention_period = var.rds_backup_retention_period
  backup_window          = var.rds_backup_window
  maintenance_window     = var.rds_maintenance_window
  
  tags = var.common_tags
}
