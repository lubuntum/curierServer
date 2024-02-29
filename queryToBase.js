const sqlite3 = require('sqlite3').verbose()
const sessionKeysGen = require('randomstring')
const NOT_VALIDATE_ERR = "Not validate"
const NOT_SUCH_EMPLOYEE = "Employee doesnt exists"
const UPDATE_SUCCESS = "Data updated"

const db = new sqlite3.Database('./database/database.sqlite', (err)=>{
    if (err) console.log(err.message)
    else console.log('Connected to database')
})

//Запросы к БД
// работа с хэш => crypto.createHash('md5').update('123').digest('hex')
const getEmployeeByLogin = async (request)=>{
    return new Promise(function(resolve, reject){
        const {pass, login} = request.body
        console.log(`pass = ${pass}, login = ${login}`)
        //const login = 'User1'
        //const pass = '202cb962ac59075b964b07152d234b70'
        const query = 'SELECT * FROM Employee WHERE login = ?'
        db.get(query, [login], (err, employee)=>{
            if(err){
                reject(err)
            }
            console.log(`Employee = ${employee}, eP = ${employee.password}, pass = ${pass}, valid=${employee.password === pass}`)
            if(employee && employee.password === pass){
                const sessionKey = sessionKeysGen.generate({length:32, charset:'alphanumeric'})
                const updateEmployeeQuery = 'UPDATE Employee SET session_key = ? WHERE login = ?'
                db.run(updateEmployeeQuery, [sessionKey, login], (err)=>{
                    if(err) reject(err)
                    else resolve({id: employee.id,
                                    name:employee.name, 
                                    secondName:employee.second_name,
                                    patronymic: employee.patronymic, 
                                    sessionKey: sessionKey})
                })
                //update session to employee in db
                //resolve(sessionKey)
            }
            else{
                reject("Пароль введен не верно")
            }
        })
    })
}
const getOrdersByStatusAndEmployeeId = (request)=>{
    return new Promise(function(resolve, reject){
        validateRequest(request)
        .then((isValid)=>{
            console.log(isValid)
            if(!isValid) reject(NOT_VALIDATE_ERR)
            console.log("next")
            const {id, status} = request.body
            const query =  `SELECT "Order".date, "Order".result_price, Clients.name, Clients.second_name, Clients.patronymic, Clients.phone, Status.status_str
            FROM "Order"
            INNER JOIN Status ON "Order".status_id = Status.id
            INNER JOIN Clients ON Clients.id = "Order".clients_id
            WHERE Status.status_str = ? AND "Order".employee_id = ?;` 
            db.all(query, [status, id], (err, rows)=>{
                if(err) reject(err)
                else resolve(rows)
        })
        })
        .catch(err=>{
            console.log(`error => ${err}`)
            reject(NOT_VALIDATE_ERR)
        })
    })
}
const logoutEmployee = (request)=>{
    return new Promise((resolve, reject)=>{
        console.log(`id = ${request.body}`)
        const {id, sessionKey} = request.body
        const query = `UPDATE Employee set session_key = NULL WHERE session_key = ? and id = ?`
        db.run(query,[sessionKey, id], (err)=>{
            if(err) reject(NOT_SUCH_EMPLOYEE)
            else resolve(UPDATE_SUCCESS)
        } )
    })
}
/*Сделать что бы пользователь мог обновлять статус товаров и можно на logout*/

/**
 * 
 * @param {*} request 
 * @returns 
 * функция для провеки зарегистрирован ли пользователь
 */
const validateRequest = async (request)=>{ //test session key = R8zm0GDv4QINd1T2aoqUbQzkDJ9PhbG9
    const sessionKey = request.body.sessionKey
    const query = "SELECT session_key from Employee where session_key = ?"
    return new Promise((resolve, reject)=>{
        db.get(query, [sessionKey], (err, key)=>{
            if(err || key === undefined) reject(false )
            else resolve(key['session_key'] === sessionKey)
        })
    })
    
}
/*Начать писать API для мобилки, 
1) сделать окно авторизации и допуска к приложению
2) после регистрации сохранять все данные employee ФИО, login, sessionKey локально в SharedPreferences в мобилке, а также sessionKey
3) реализовать запросы к API, получение всех Order для работника
4)
*/
module.exports = {db, getEmployeeByLogin, getOrdersByStatusAndEmployeeId, logoutEmployee, UPDATE_SUCCESS, NOT_SUCH_EMPLOYEE, NOT_VALIDATE_ERR}