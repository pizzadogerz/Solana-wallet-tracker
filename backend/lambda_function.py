import json


def lambda_handler(event, context):
    wallet = event["pathParameters"]["address"]
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"wallet": wallet})
        
    }

if __name__ == "__main__":
    fake_event = {
        "pathParameters": {"address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"}
    }
    print(lambda_handler(fake_event, None))