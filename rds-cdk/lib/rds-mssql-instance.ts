import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { SqlServerSeeder } from './sql-mssql-seeder';
import * as path from 'path';

/**
 * This stack creates a new RDS database that acts as the source
 * of snapshots used for Release Instant Datasets. 
 */
export class RdsMssqlInstanceStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {

    super(scope, id, props);

    const DATABASE_PORT = 1433;

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

    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: 'release-mssql-demo-db',
      publiclyAccessible: true,
      engine: rds.DatabaseInstanceEngine.sqlServerEx({
        version: rds.SqlServerEngineVersion.VER_15
      }),
      port: DATABASE_PORT,
      allocatedStorage: 20,
      licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM) ,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
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

    database.connections.allowFromAnyIpv4(ec2.Port.tcp(DATABASE_PORT), 'Public ingress to SQL Server');

    const seeder = new SqlServerSeeder(this, "SqlSeeder", { 
      database: database,
      port: DATABASE_PORT,
      vpc: vpc,
      createScriptPath: ("resources/sql-seed-script.sql"),     // creates a ReleaseDemo database with users table that's seeded by a few rows of fake names
      //deleteScriptPath: "sql/cleanup.sql"   // there's nothing to clean up. 
    });
    
    const seededSnapshot = new cr.AwsCustomResource(this, 'CreateSeededRdsSnapshot', {
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      onCreate: {
        service: 'RDS',
        action: 'createDBSnapshot',
        parameters: {
          DBInstanceIdentifier: database.instanceIdentifier,
          DBSnapshotIdentifier: database.instanceIdentifier + '-seeded'
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('DBSnapshot.DBSnapshotIdentifier'), // Use the token returned by the call as physical id
      },
      onDelete: {
        service: 'RDS',
        action: 'deleteDBSnapshot',
        parameters: {
          DBSnapshotIdentifier: new cr.PhysicalResourceIdReference(),
        }
      }
    });

    new CfnOutput(this, 'database_endpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'DNS endpoint of RDS database'
    });

    new CfnOutput(this, 'seeded_db_snapshot_id', {
      value: seededSnapshot.getResponseField('DBSnapshot.DBSnapshotIdentifier'),
      description: 'Id of manualsnapshot created by running SQL bootstrap script'
    });

    new CfnOutput(this, 'snapshot_db_admin_username', {
      value: seededSnapshot.getResponseField('DBSnapshot.MasterUsername'),
      description: 'Admin username for seeded DB snapshot'
    });

    const secretName = database.secret?.secretName || '<no associated secret>';

    new CfnOutput(this, 'db_credentials_secret_name', {
      value: secretName,
      description: 'The AWS Secrets Manager secret containing admin username and password for the database',
    });

    const commandToGetCredentials = `aws secretsmanager get-secret-value --secret-id ${secretName} --output json | jq -r ".SecretString"`

    new CfnOutput(this, 'get_db_credentials_command', {
      value: commandToGetCredentials,
      description: 'Run this CLI command to get the database username and password from AWS Secrets Manager'
    });

  }
}


function generateSnapshotIdentifier(databaseId: string){

  function pad(n: Number) {return n<10 ? "0"+n : n}
  var d = new Date()
  var YYYY=d.getFullYear();
  var MM=pad(d.getMonth()+1);
  var DD=pad(d.getDate());
  var hh = pad(d.getHours());
  var mm = pad(d.getMinutes());
  var ss = pad(d.getSeconds());
  var snapshotId = `${databaseId}-${YYYY}-${MM}-${DD}-${hh}-${ss}`;
  return snapshotId;

}