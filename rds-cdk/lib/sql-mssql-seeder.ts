// This could was largely adapted from the project below: 
// https://github.com/kolomied/cdk-sqlserver-seeder
// License at time of use was: 
/*

   
MIT License

Copyright (c) 2020 Dmitry Kolomiets

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { Duration, RemovalPolicy, CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';

export interface SqlServerSeederProps {
  readonly vpc: ec2.IVpc;
  readonly database: rds.DatabaseInstance,
  readonly port: number,

  readonly createScriptPath: string,
  readonly deleteScriptPath?: string,

  /**
   * The amount of memory, in MB, that is allocated to custom resource's Lambda function.
   * May require some tweaking for "hunger" SQL scripts.
   * @default 512
   */
  readonly memorySize?: number,

  /**
   * Flag that allows to ignore SQL errors.
   * May be helpful during troubleshooting.
   * @default false
   */
  readonly ignoreSqlErrors?: boolean
}

export class SqlServerSeeder extends Construct {

  constructor(scope: Construct, id: string, props: SqlServerSeederProps) {
    super(scope, id);

    if (!props.database.secret) {
      throw new Error("Database does not have secret value assigned");
    }
    if (!fs.existsSync(props.createScriptPath)) {
      throw new Error("Create script does not exist: " + process.cwd() + props.createScriptPath);
    }
    if (props.deleteScriptPath && !fs.existsSync(props.deleteScriptPath)) {
      throw new Error("Delete script does not exist: " + props.deleteScriptPath);
    }

    const destinationBucket = new s3.Bucket(this, 'bucket', { removalPolicy: RemovalPolicy.DESTROY });
    this.prepareSqlScripts(id, props, destinationBucket);

    const sqlSeederLambda = new lambda.Function(this, 'lambda', {
      code: new lambda.AssetCode('resources/lambda-seed-function/package.zip'),
      handler: 'seed::seed.Bootstrap::ExecuteFunction',
      timeout: Duration.seconds(300),
      runtime: lambda.Runtime.DOTNET_6,
      memorySize: props.memorySize,
      
      //vpc: props.vpc,
      //vpcSubnets: {
      //  subnetType: ec2.SubnetType.PUBLIC
      //},
      environment: {
        "DbEndpoint": props.database.dbInstanceEndpointAddress,
        "SecretArn": props.database.secret?.secretArn,
        "ScriptsBucket": destinationBucket.bucketName,
        "RunOnDelete": `${!!props.deleteScriptPath}`
      }
    });

    const sqlSeederProvider = new cr.Provider(this, 'provider', {
      onEventHandler: sqlSeederLambda
    });
    const sqlSeederResource = new CustomResource(this, 'resource', {
      serviceToken: sqlSeederProvider.serviceToken,
      properties: {
        "IgnoreSqlErrors": !!props.ignoreSqlErrors
      }
    });
    sqlSeederResource.node.addDependency(props.database);

    // allow access
    destinationBucket.grantRead(sqlSeederLambda);
    props.database.secret?.grantRead(sqlSeederLambda);

    // enable connection to RDS instance
    //sqlSeederLambda.connections.allowTo(props.database, ec2.Port.tcp(props.port));
  }

  private prepareSqlScripts(id: string, props: SqlServerSeederProps, destinationBucket: s3.Bucket) {
    tmp.setGracefulCleanup();
    tmp.dir((err, dir) => {
      if (err)
        throw err;

      fs.copyFileSync(props.createScriptPath, path.join(dir, 'create.sql'));

      if (props.deleteScriptPath) {
        fs.copyFileSync(props.deleteScriptPath, path.join(dir, 'delete.sql'));
      }

      new BucketDeployment(this, id, {
        sources: [Source.asset(dir)],
        destinationBucket,
        retainOnDelete: false
      });
    });
  }
}
