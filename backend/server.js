// Servidor Node.js para integração segura com Mercado Pago
// NUNCA exponha o ACCESS_TOKEN no front-end!

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do front-end (pasta pai)
app.use(express.static(path.join(__dirname, '..')));

// Configuração do Mercado Pago com Access Token do .env
const client = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN
});

// URL base para os redirecionamentos (mude para produção quando publicar)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Endpoint para criar preferência de pagamento
app.post('/criar-preferencia', async (req, res) => {
    try {
        const { titulo, preco, quantidade, descricao, metodoPagamento } = req.body;

        const preference = new Preference(client);
        
        // Define os métodos de pagamento excluídos baseado na escolha do usuário
        let excludedPaymentMethods = [];
        let excludedPaymentTypes = [];
        
        if (metodoPagamento === 'pix') {
            excludedPaymentTypes = [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'ticket' }
            ];
        } else if (metodoPagamento === 'cartao') {
            excludedPaymentTypes = [
                { id: 'ticket' },
                { id: 'bank_transfer' }
            ];
        } else if (metodoPagamento === 'boleto') {
            excludedPaymentTypes = [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'bank_transfer' }
            ];
        }
          const preferenceData = {
            items: [
                {
                    title: titulo || 'Produto QSESMI',
                    description: descricao || 'Produto do projeto Quem Sou Eu Sem Meus Irmãos',
                    unit_price: Number(preco) || 100.00,
                    quantity: Number(quantidade) || 1,
                    currency_id: 'BRL'
                }
            ],
            payment_methods: {
                excluded_payment_types: excludedPaymentTypes,
                excluded_payment_methods: excludedPaymentMethods,
                installments: 12
            },
            statement_descriptor: 'QSESMI'
        };

        // Adiciona back_urls e auto_return apenas se não for localhost
        // (Mercado Pago não aceita localhost nas URLs de retorno com auto_return)
        if (!BASE_URL.includes('localhost')) {
            preferenceData.back_urls = {
                success: `${BASE_URL}/pagamento-sucesso.html`,
                failure: `${BASE_URL}/pagamento-erro.html`,
                pending: `${BASE_URL}/pagamento-pendente.html`
            };
            preferenceData.auto_return = 'approved';
        }

        const response = await preference.create({ body: preferenceData });

        res.json({
            id: response.id,
            init_point: response.init_point
        });    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Endpoints disponíveis:');
    console.log('  POST /criar-preferencia - Cria uma preferência de pagamento');
});
