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

        // Define os métodos de pagamento baseado na escolha do usuário
        // Documentação: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
        let excludedPaymentTypes = [];
        let defaultPaymentMethodId = null;

        if (metodoPagamento === 'pix') {
            // Exclui tudo menos PIX (bank_transfer inclui PIX)
            excludedPaymentTypes = [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'ticket' },
                { id: 'account_money' },
                { id: 'prepaid_card' }
            ];
            defaultPaymentMethodId = 'pix';
        } else if (metodoPagamento === 'cartao') {
            // Exclui tudo menos cartões
            excludedPaymentTypes = [
                { id: 'ticket' },
                { id: 'bank_transfer' },
                { id: 'account_money' },
                { id: 'prepaid_card' }
            ];
        } else if (metodoPagamento === 'boleto') {
            // Exclui tudo menos boleto (ticket)
            excludedPaymentTypes = [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'bank_transfer' },
                { id: 'account_money' },
                { id: 'prepaid_card' }
            ];
        }

        // Garante que o preço seja um número válido com 2 casas decimais
        const precoFinal = parseFloat(Number(preco).toFixed(2)) || 100.00;

        const preferenceData = {
            items: [
                {
                    title: titulo || 'Produto QSESMI',
                    description: descricao || 'Produto do projeto Quem Sou Eu Sem Meus Irmãos',
                    unit_price: precoFinal,
                    quantity: Number(quantidade) || 1,
                    currency_id: 'BRL'
                }
            ],
            payment_methods: {
                excluded_payment_types: excludedPaymentTypes,
                installments: 12
            },
            statement_descriptor: 'QSESMI',
            expires: false
        };

        // Define o método de pagamento padrão se especificado
        if (defaultPaymentMethodId) {
            preferenceData.payment_methods.default_payment_method_id = defaultPaymentMethodId;
        }

        // Adiciona back_urls e auto_return apenas se não for localhost
        // (Mercado Pago não aceita localhost nas URLs de retorno com auto_return)
        if (!BASE_URL.includes('localhost')) {
            preferenceData.back_urls = {
                success: `${BASE_URL}/pagamento-sucesso.html`,
                failure: `${BASE_URL}/pagamento-erro.html`,
                pending: `${BASE_URL}/pagamento-pendente.html`
            };
            preferenceData.auto_return = 'approved';
        } const response = await preference.create({ body: preferenceData });

        // Log para debug
        console.log('Preferência criada com sucesso:');
        console.log('  - Produto:', titulo);
        console.log('  - Preço:', precoFinal);
        console.log('  - Método:', metodoPagamento);
        console.log('  - ID:', response.id);

        res.json({
            id: response.id,
            init_point: response.init_point
        });
    } catch (error) {
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
