import { server } from 'user-managements-node-server/src/'
import appConfig from './app.config.json' //Do the setup duo to the readme on the repository
import { EVENTS } from 'user-managements-node-server/src/consts'
import fetch from 'node-fetch'
import proxy from 'express-http-proxy'
import express from 'express'

const getExpressMiddleware = ({ host, port,userRoutePrefix }) => (
    (req, res) => {
        const { headers , body } = req //On header sould be the token, you can get it after the user login

        return fetch(
            `http://${host}:${port}${userRoutePrefix}/is-authenticated`, //This endpoint exist in user managements
            {
                headers,
                method: 'POST',
                body
            }
        )
        .then((response) => {
            return response.json()
        })
        .then(({ error, httpStatusCode, message }) => {
            if(error){
                throw { error, httpStatusCode, message }
            }
            res
                .status(httpStatusCode)
                .json({ httpStatusCode, message })
        })
        .catch(({ httpStatusCode, message, error }) => {
            res
                .status(httpStatusCode)
                .json({ httpStatusCode, message, error })
        })
    }
)
/* You can edit your own appConfig, In this example I took appConfig from tests inside the module */
server({ appConfig })
    .then(ref =>{

        ref
                .addListener(EVENTS.USER_CREATED, (userInfo) => { //Notify you when user created
                console.log(userInfo)
            })

        ref
            .addListener(EVENTS.NOTIFY_ADMIN_WHEN_USER_APPROVED, (userInfo) => { //Notify admin when user approved
                console.log(userInfo)
            })

        const userApproved = (userInfo) => { //Notify user when he approved
            console.log(userInfo)
        }

        ref
            .addListener(EVENTS.USER_APPROVED, userApproved)
        /* You can also do the following:

         * Remove listener be using removeListener as follows
            removeListener(EVENTS.USER_APPROVED, userApproved) //In case of remove you have to supply the handler function

         * Stop the server as follows
            ref.stop()

        */

        console.log(`User managements id running: ${ref.host}:${ref.port}`)

    })
    .catch(error => {
        console.log(error)
    })



    const doesUserAuthenticated = getExpressMiddleware({ host: 'localhost', port: appConfig.port, userRoutePrefix: appConfig.userRoutePrefix })

    const yourExpressServer = (config) => {

        const userApiAddress = `http://localhost:${config.userMgtPort}`

		const redirectUrl = (req, res, next) => {
		  Object
			.assign(
			  req,
			  {
				url: req.originalUrl.replace('/api', '')
			  }
			)

		  next()
		}

        const app = express()

		app.use('/api/user', redirectUrl, proxy(userApiAddress))
        app.get('/api/api-that-require-authenticate-user', doesUserAuthenticated, (req, res) => {
            res.json({ isAuthenticated: true })//Just in case it will pass doesUserAuthenticated otherwise it will return response error
        })
        const server = app.listen(config.port, () => {
            console.log('mid up')
        })
    }

    yourExpressServer({port: 3030, userMgtPort: appConfig.port})
