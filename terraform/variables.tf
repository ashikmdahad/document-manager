# AWS Configuration
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Common Tags
variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "terraform-infrastructure"
    ManagedBy   = "terraform"
  }
}

# EC2 Variables
variable "ec2_instance_name" {
  description = "Name of the EC2 instance"
  type        = string
  default     = "web-server"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_ami_id" {
  description = "AMI ID for the EC2 instance (Amazon Linux 2 in us-east-1)"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type
}

variable "ec2_key_pair_name" {
  description = "Name of the AWS key pair for EC2 access"
  type        = string
}

variable "ec2_volume_size" {
  description = "Size of the EC2 root volume in GB"
  type        = number
  default     = 20
}

variable "ec2_volume_type" {
  description = "Type of the EC2 root volume"
  type        = string
  default     = "gp3"
}

variable "ec2_security_group_rules" {
  description = "Security group rules for the EC2 instance"
  type = object({
    ingress = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
      description = string
    }))
    egress = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
      description = string
    }))
  })
  default = {
    ingress = [
      {
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "SSH access"
      },
      {
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTP access"
      },
      {
        from_port   = 443
        to_port     = 443
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTPS access"
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
}

# RDS Variables
variable "rds_db_identifier" {
  description = "The name of the RDS instance"
  type        = string
  default     = "myapp-database"
}

variable "rds_db_name" {
  description = "The name of the database to create when the DB instance is created"
  type        = string
  default     = "myappdb"
}

variable "rds_db_username" {
  description = "Username for the master DB user"
  type        = string
  default     = "admin"
}

variable "rds_db_password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true
}

variable "rds_db_engine" {
  description = "The database engine"
  type        = string
  default     = "mysql"
}

variable "rds_db_engine_version" {
  description = "The engine version to use"
  type        = string
  default     = "8.0"
}

variable "rds_db_instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 20
}

variable "rds_storage_type" {
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), or 'io1' (provisioned IOPS SSD)"
  type        = string
  default     = "gp2"
}

variable "rds_storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted"
  type        = bool
  default     = true
}

variable "rds_security_group_rules" {
  description = "Security group rules for the RDS instance"
  type = object({
    ingress = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
      description = string
    }))
    egress = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
      description = string
    }))
  })
  default = {
    ingress = [
      {
        from_port   = 3306
        to_port     = 3306
        protocol    = "tcp"
        cidr_blocks = ["10.0.0.0/8"]
        description = "MySQL/Aurora access from VPC"
      }
    ]
    egress = []
  }
}

variable "rds_backup_retention_period" {
  description = "The days to retain backups for"
  type        = number
  default     = 7
}

variable "rds_backup_window" {
  description = "The daily time range (in UTC) during which automated backups are created"
  type        = string
  default     = "03:00-04:00"
}

variable "rds_maintenance_window" {
  description = "The window to perform maintenance in"
  type        = string
  default     = "sun:04:00-sun:05:00"
}
