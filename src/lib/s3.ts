import { z } from "zod"
import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3"
import { DumpFile } from "@/lib/kube/types"

export async function grepS3BucketFiles({
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
  bucketName,
  prefix,
  searchString,
}: {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  prefix: string
  searchString: string
}): Promise<Array<DumpFile>> {
  const s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
  try {
    const command = new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: prefix,
    })

    const data = await s3.send(command)
    const matchedFiles = data.Contents?.filter((file) => {
      return file.Key?.includes(searchString)
    })

    if (matchedFiles && matchedFiles.length > 0) {
      return matchedFiles.map((file) => {
        return {
          name: file.Key,
          size: file.Size,
          lastModified: z.coerce.date().parse(file.LastModified),
        }
      })
    } else {
      console.log("No matching files found.")
      return []
    }
  } catch (error) {
    console.error(error)
    return []
  }
}
