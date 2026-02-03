// Servidor Node.js para integração segura com Mercado Pago
// NUNCA exponha o ACCESS_TOKEN no front-end!

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Mercado Pago com Access Token do .env
const client = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN
});

// Endpoint para criar preferência de pagamento
app.post('/criar-preferencia', async (req, res) => {
    try {
        const { titulo, preco, quantidade, descricao } = req.body;

        const preference = new Preference(client);

        const preferenceData = {            items: [
                {
                    title: titulo || 'Produto QSESMI',
                    description: descricao || 'Produto do projeto Quem Sou Eu Sem Meus Irmãos',
                    unit_price: Number(preco) || 100.00,
                    quantity: Number(quantidade) || 1,
                    currency_id: 'BRL'
                }
            ],
            back_urls: {
                success: 'http://localhost:3001/pagamento-sucesso.html',
                failure: 'http://localhost:3001/pagamento-erro.html',
                pending: 'http://localhost:3001/pagamento-pendente.html'
            },
            auto_return: 'approved'
        };

        const response = await preference.create({ body: preferenceData });

        res.json({
            id: response.id,
            init_point: response.init_point
        });

    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Servir arquivos estáticos do front-end (opcional, para testes locais)
app.use(express.static('../'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Endpoints disponíveis:');
    console.log('  POST /criar-preferencia - Cria uma preferência de pagamento');
});
