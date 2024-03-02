//import {getEmployeeByLogin} from './queryToBase.js'
//import {test} from './queryToBase.js'
//import {bodyParser} from 'body-parser'
//Проблема с импортами функций, поле импорта протестировать создания сессионного ключа в orders
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended:true,
}))
const PORT = 3000
const ADDRESS = '192.168.157.75'

const db = require('./queryToBase.js')
/*
db.all("SELECT * FROM Employee", (err, rows)=>{
    if(err) console.log(err)
    else {
        rows.forEach(row=>{
            console.log(row['login'])
        })
    }
})
*/
app.post('/auth', (req, res)=>{
    console.log("start auth...")
    db.getEmployeeByLogin(req)
    .then(employeeData => {
        console.log(employeeData)
        res.status(200).json({employee: employeeData})
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({authError:"No such user"})
    })
})

app.post('/orders', (req, res)=>{
    db.getOrdersByStatusAndEmployeeId(req)
    .then(employeeData =>{
        if(employeeData === db.NOT_VALIDATE_ERR){
            console.log(employeeData)
            res.status(401).send(db.NOT_VALIDATE_ERR)
            return
        }
        //console.log(employeeData)
        res.status(200).json({orders:employeeData})
    })
    .catch(err=>{
        res.status(500).send(err)
        console.log(err)
    })
})
    
app.post('/logout', (req, res)=>{
    console.log(req.body)
    db.logoutEmployee(req)
    .then(data => {
        if(data === db.NOT_SUCH_EMPLOYEE){
            res.status(401).send(db.NOT_SUCH_EMPLOYEE)
            return
        }
        else{
            res.status(200).send(db.UPDATE_SUCCESS)
        }
    })
    .catch(err=>{
        res.status(401).send(db.NOT_SUCH_EMPLOYEE)
        console.log(err)
    })
})

app.get('/orders/food', (req,res)=>{
    console.log("get food by order")
    db.getFoodByOrder(req)
        .then(data =>{
            console.log(data)
            res.status(200).json({foods:data})
        })
        .catch(err=>{
            res.status(400).send(err)
        })
})
app.put('/order/status-change',(req,res)=>{
    db.changeOrderStatus(req)
        .then(result =>{
            res.status(200).send()
        })
        .catch(err=>{
            res.status(500).send(err)
        })
})

app.listen(PORT, ADDRESS, ()=>{
    console.log(`server start at ${PORT}, hostname ${ADDRESS}`)
})
