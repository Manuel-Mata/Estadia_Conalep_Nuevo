import mysql from 'mysql2'
import keys from '../keys'

const connection = mysql.createConnection(keys);

export default connection;