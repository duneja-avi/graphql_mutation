import { map, groupBy, pathOr } from 'ramda';
import DataLoader from 'dataloader';
import axios from 'axios';
import stripTags from 'striptags';
import query from './db';

export async function searchBook(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${
    encodeURIComponent(query)}`;
  try {
    const result = await axios(url);
    const items = pathOr([], ['data', 'items'], result);
    const books = map(book => ({ id: book.id, ...book.volumeInfo }), items);
    return books;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function findBooksByIds(ids) {
  const sql = `
  select * 
  from hb.book
  where hb.book.id = ANY($1);
  `;
  const params = [ids];
  try {
    const result = await query(sql, params);
    const rowsById = groupBy((book) => book.id, result.rows);
    return map(id => {
      const book = rowsById[id] ? rowsById[id][0] : null;
      return book;
    } , ids);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export function findBooksByIdsLoader() {
  return new DataLoader(findBooksByIds);
}

export async function findBookById(id) {
  const sql = `
  select * 
  from hb.book
  where hb.book.id = $1;
  `;
  const params = [id];
  try {
    const result = await query(sql, params);
    return result.rows[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

const ORDER_BY = {
  ID_DESC: 'id desc',
  RATING_DESC: 'rating desc',
};

export async function allBooks() {
  var AWS = require('aws-sdk');
  // Set the region
  AWS.config.update({region: 'ap-southeast-2'});
  console.log("Starting")
  // Create the DynamoDB service object
  var ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});


  var params = {

    KeyConditionExpression: "#book_id = :1",
    ExpressionAttributeNames: {
      "#book_id": "book_id"
    },
    ExpressionAttributeValues: {
      ":1": "1"
    },
    TableName: "book"
//   ProjectionExpression: 'ATTRIBUTE_NAME'
  };


  return ddb.query(params).promise()
      .then(data => {
            console.log("Returning :  ", typeof (data.Items[0]), JSON.stringify(extractData(data.Items[0])))
            return extractData(data.Items[0])
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

export function imageUrl(size, id) {
  const zoom = size === 'SMALL' ? 1 : 0;
  return `//books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=${zoom}&source=gbs_api`;
}

export async function createBook(googleBookId) {
  try {
    const book = await findBookByGoogleId(googleBookId);
    const {
      title = '',
      subtitle = '',
      description = '',
      authors = [],
      pageCount = 0,
    } = book;
    const sql = `
    select * from hb.create_book($1, $2, $3, $4, $5, $6);
    `;
    const params = [
      googleBookId,
      stripTags(title),
      stripTags(subtitle),
      stripTags(description),
      authors,
      pageCount,
    ];
    const result = await query(sql, params);
    return result.rows[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function findBookByGoogleId(googleBookId) {
  const url = `https://www.googleapis.com/books/v1/volumes/${googleBookId}`;
  try {
    const result = await axios(url);
    const book = pathOr({}, ['data'], result);
    return { ...book, ...book.volumeInfo };
  } catch (err) {
    console.log(err);
    throw err;
  }
}