const express = require('express')
const router = express.Router()
const { JsonDB } = require('node-json-db')
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')
const { Rcon } = require('rcon-client')

var db = new JsonDB(new Config("users", true, true, '/'));
const rewards = require('../rewards.json')
const config = require('../config.json')

async function giveReward(index, player) {
    const rcon = new Rcon({ host: config.host, port: config.port, password: config.password })    
    await rcon.connect()
    console.log(await rcon.send(rewards[index].command.replace('%player%', player)))
    rcon.end()
}

router.post('/', (req, res) => {
    if (req.body.nickname) {
        if (req.body.nickname.match(/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/g)) res.render('main', { valid: "is-invalid" })
        if (req.body.nickname.length < 3 || req.body.nickname.length > 12) res.render('main', { valid: "is-invalid" })
        else res.render('panel/panel', { name: req.body.nickname, rewards })
    } else {
        res.render('main', { valid: "is-invalid" })
    }
})

router.post('/farm', (req, res) => {
    res.render('panel/farm', { task: rewards[req.body.task], name: req.body.name, time: rewards[req.body.task].time })
})

router.post('/count', (req, res) => {
    try {   
        var data = db.getData(`/${req.body.name}/tasks/${req.body.task}`)

        if (data.progress >= rewards[req.body.task].time) {
            res.json({ message: 'Finished task' })
            db.push(`/${req.body.name}/tasks/${req.body.task}`, {
                progress: 0,
                lastUsed: Date.now()
            })
            
            giveReward(req.body.task, req.body.name)

        } else if ((Date.now() - data.lastUsed) >= 30000) {
            db.push(`/${req.body.name}/tasks/${req.body.task}`, {
                progress: data.progress + 30,
                lastUsed: Date.now()
            })
            res.json({ message: 'Progress added', progress: data.progress + 30 });
        } else {
            res.json({ message: 'Rate limited' })
        }

    } catch(error) {
        db.push(`/${req.body.name}/tasks/${req.body.task}`, {
            progress: 0,
            lastUsed: Date.now()
        }, false)
    };
})

module.exports = router