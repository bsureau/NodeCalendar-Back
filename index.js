// Dépendances
const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const passport = require('passport')

// Config
const PORT = process.env.PORT || 3000

// Init users & events
const users = [{id: 0, email: 'benjamin.sureau@disko.fr', pwd: 'azerty'}]
const events = []

const app = express()
const cors = require('cors')
app.use(cors({credentials: true, origin: true}))

const urlEncodedParser = bodyParser.urlencoded({extended: false})

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = 'mon petit grain de sel'

passport.use(new JwtStrategy(opts, (jwt_payload, next) => {
    let user = users.find(function (element) {
        if (element.email === jwt_payload.email) return element
    })

    if (user) {
        return next(null, user);
    } else {
        return next(null, false);
    }
}))

app.post('/signup', urlEncodedParser, (req, res) => {
    let email = req.body.email
    let pwd = req.body.pwd
    let confirmpwd = req.body.confirmpwd

    if (pwd !== confirmpwd) {
        res.status(401).json({error: 'Passwords must match'})
        return
    }

    let user = users.find((element) => {
        if (element.email === email) return element
    })

    if (user) {
        res.status(401).json({error: 'Email address is already in use'})
        return
    }

    let newuser = {
        'id': users.length,
        'email': email,
        'pwd': pwd
    }

    users.push(newuser);

    let myJwt = jwt.sign({email: email}, 'mon petit grain de sel');
    res.json({
        jwt: myJwt
    })

})

app.post('/login', urlEncodedParser, (req, res) => {
    let email = req.body.email
    let pwd = req.body.pwd

    let user = users.find((element) => {
        if (element.email === email) return element
    })

    if (user == null) {
        res.status(401).json({error: email + ' does not exist'})
        return
    } else if (user != null && user.pwd !== pwd) {
        res.status(401).json({error: 'Invalid password'})
        return
    } else if (user.pwd === pwd) {
        let payload = {
            email: user.email
        }

        let myJwt = jwt.sign(payload, 'mon petit grain de sel');
        res.json({
            jwt: myJwt
        })
    }
})

app.get('/myevents', passport.authenticate('jwt', {session: false}), (req, res) => {
    let eventsPersos = events.filter(event => event.userId === req.user.id)
    res.send(eventsPersos)
})

app.get('/event/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    const userevent = events.filter(event => event.userId === req.user.id && event.eventId == req.params.id)
    if (userevent.length === 0) {
        res.status(401).json({error: 'Evénement introuvable'})
        return
    }
    res.send(userevent);
})

app.post('/add', passport.authenticate('jwt', {session: false}), urlEncodedParser, (req, res) => {
    let newEvent = {
        eventId: events.length,
        title: req.body.title,
        desc: req.body.desc,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        userId: req.user.id
    }
    events.push(newEvent)
    res.send(newEvent)
})

app.get('/del/:id', passport.authenticate('jwt', {session: false}), urlEncodedParser, (req, res) => {

    const userevent = events.filter(event => event.userId === req.user.id && event.eventId == req.params.id)
    if (userevent.length === 0) {
        res.status(401).json({error: 'Evénement introuvable'})
        return
    }
    events.splice(userevent[0].eventId, 1)

    for (let iterator = 0; iterator < events.length; iterator++) {
        events[iterator].eventId = iterator
    }

    res.status(200).json({response: 'L\'événement ' + userevent[0].title + ' [id : ' + userevent[0].eventId + '] a bien été supprimé'})
})

app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT)
})
