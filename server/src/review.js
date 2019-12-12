import { groupBy, map } from 'ramda';
import DataLoader from 'dataloader';
import query from './db';

const ORDER_BY = {
  ID: 'id',
  ID_DESC: 'id desc',
};

async function findReviewsByBookIds(ids) {
  const sql = `
  select * 
  from hb.review
  where book_id = ANY($1)
  order by id;
  `;
  const params = [ids];
  try {
    const result = await query(sql, params);
    const rowsById = groupBy(review => review.bookId, result.rows);
    return map(id => rowsById[id], ids);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export function findReviewsByBookIdsLoader() {
  return new DataLoader(findReviewsByBookIds);
}

export async function createReview(args) {
  var AWS = require('aws-sdk');
  AWS.config.update({region: 'ap-southeast-2'});
  console.log("Starting")
  // Create the DynamoDB service object
  var ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
//   var params = {
//
//     KeyConditionExpression: "#book_id = :1",
//     ExpressionAttributeNames: {
//       "#book_id": "book_id"
//     },
//     ExpressionAttributeValues: {
//       ":1": "1"
//     },
//     TableName: "book"
// //   ProjectionExpression: 'ATTRIBUTE_NAME'
//   };
  const writeParams = {
    TableName: "book",
    Item: {
      book_author: "TestPut",
      book_id: "testPut",
      book_name: "Avi's creation",
      id:33,
    }
  }
  console.log(`Params write : ${JSON.stringify(writeParams)}`);
  console.log("Üpdating the items");
  return ddb.put(writeParams).promise()
      .then(data => {
            console.log("Returning :  ", JSON.stringify(data));
            const result = {Callback: 'true', id: 33};
            console.log(JSON.stringify(result));
            return result
          }
      ).catch(err => {
            console.log("Error thrown AVI  ", err)
          }
      )
  }

const extractData = obj => {
  const resultMap = {}
  resultMap.date = obj.date,
      resultMap.book_id = obj.book_id,
      resultMap.book_author = obj.book_author
  return resultMap
}
// export async function createReview(reviewInput) {
//   const { bookId, email, name, rating, title, comment } = reviewInput;
//
//   const sql = `
//   select * from hb.create_review($1, $2, $3, $4, $5, $6);
//   `;
//   const params = [bookId, email, name, rating, title, comment];
//   try {
//     const result = await query(sql, params);
//     return result.rows[0];
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// }

