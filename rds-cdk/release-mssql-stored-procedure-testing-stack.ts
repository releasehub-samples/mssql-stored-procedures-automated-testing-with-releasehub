import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';

export class ReleaseMssqlStoredProcedureTestingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { 
      vpcName: "release-mssql-storedproc-demo",
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'public-subnet-2',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ]
    });

    const DATABASE_PORT = 1433;

    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: 'release-mssql-demo',
      publiclyAccessible: true,
      engine: rds.DatabaseInstanceEngine.sqlServerEx({
        version: rds.SqlServerEngineVersion.VER_15
      }),
      port: DATABASE_PORT,
      licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM) ,
      credentials: rds.Credentials.fromGeneratedSecret('clusteradmin'), // Optional - will default to 'admin' username and generated password
      securityGroups: [
        new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
          vpc,
          allowAllOutbound: true,
          description: 'allow all inbound traffic to RDS MS SQL Server for Release demo',
        })
      ],
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    database.connections.allowFromAnyIpv4(ec2.Port.tcp(DATABASE_PORT), 'SQL Server default port');

    new CfnOutput(this, 'database_endpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'DNS endpoint of RDS database',
      exportName: 'release-demo-mssql-endpoint',
    });

    const secretName = database.secret?.secretName || '<no associated secret>';

    new CfnOutput(this, 'database_credentials_secret_name', {
      value: secretName,
      description: 'The AWS Secrets Manager secret containing admin username and password for the database',
      exportName: 'release-demo-mssql-secret-name',
    });

    const commandToGetCredentials = `aws secretsmanager get-secret-value --secret-id ${secretName} --output json | jq -r ".SecretString"`

    new CfnOutput(this, 'command_to_get_credentials', {
      value: commandToGetCredentials,
      description: 'Run this CLI command to get the database username and password from AWS Secrets Manager',
      exportName: 'release-demo-mssql-get-secret-command',
    });
  }
}