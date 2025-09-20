# Security Group for EC2
resource "aws_security_group" "ec2_sg" {
  name_prefix = "${var.instance_name}-sg"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.security_group_rules.ingress
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  dynamic "egress" {
    for_each = var.security_group_rules.egress
    content {
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
      description = egress.value.description
    }
  }

  tags = merge(var.tags, {
    Name = "${var.instance_name}-security-group"
  })
}

# EC2 Instance
resource "aws_instance" "main" {
  ami                    = var.ami_id
  instance_type         = var.instance_type
  key_name              = var.key_pair_name
  subnet_id             = var.subnet_id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  root_block_device {
    volume_type = var.volume_type
    volume_size = var.volume_size
    encrypted   = true
    delete_on_termination = true
  }

  user_data = var.user_data

  tags = merge(var.tags, {
    Name = var.instance_name
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Elastic IP (optional)
resource "aws_eip" "main" {
  count    = var.associate_public_ip ? 1 : 0
  instance = aws_instance.main.id
  domain   = "vpc"

  tags = merge(var.tags, {
    Name = "${var.instance_name}-eip"
  })

  depends_on = [aws_instance.main]
}
