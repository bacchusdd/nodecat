const express = require('express');
const axios = require('axios');


const router = express.Router();
const URL = 'http://localhost:8002/v1';

// origin 헤더 추가
axios.defaults.headers.origin = 'http://localhost:4000';

const request = async (req, api) => {
    try{
        // if session에 token이 없다면
        if (!req.session.jwt){
            const tokenResult = await axios.post(`${URL}/token`, {
                clientSecret: process.env.CLIENT_SECRET,
            });
            // session에 token 저장
            req.session.jwt = tokenResult.data.token;
        }
        // api 요청
        return await axios.get(`${URL}${api}`, {
            headers: { authorization: req.session.jwt },
        });
    } catch (error){
        // token 만료 시 삭제 후 재발급
        if (error.response.status === 419){
            delete req.session.jwt;
            return request(req, api);
        }
        // 419외 error
        return error.response;
    }
};


router.get('/mypost', async (req, res, next) => {
    try{
        const result = await request(req, '/posts/my');
        res.json(result.data);
    } catch (error){
        console.error(error);
        next(error);
    }
});

router.get('/search/:hashtag', async (req, res, next) => {
    try{
        const result = await request(
            req, `posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
        );
        res.json(result.data);
    } catch (error){
        if (error.code){
            console.error(error);
            next(error);
        }
    }
});


/*
router.get('/test', async (req, res, next)=>{
    try{
        // 만약 세션에 토큰이 없다면 토큰 발급 시도
        if (!req.session.jwt){
            const tokenResult = await axios.post('http://localhost:8002/v1/token', {
                clientSecret: process.env.CLIENT_SECRET,
            });

            if (tokenResult.data && tokenResult.data.code === 200){
                req.session.jwt = tokenResult.data.token;
            } else{
                return res.json(tokenResult.data);
            }
        }
        // 발급 받은 토큰 테스트
        const result = await axios.get('http://localhost:8002/v1/test', {
            headers: { authorization: req.session.jwt },
        });
        return res.json(result.data);
    } catch(error){
        console.error(error);
        // 토큰 만료 시
        if (error.response.status === 419){
            return res.json(error.response.data);
        }
        return next(error);
    }
});
*/

module.exports = router;