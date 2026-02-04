// api/criar-preferencia.js
// Este arquivo deve ser colocado no repositório qsesmi-pagamentos na Vercel

const mercadopago = require('mercadopago');

// Configuração do Mercado Pago
mercadopago.configure({
    access_token: process.env.ACCESS_TOKEN
});

module.exports = async (req, res) => {
    // Habilita CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Responde ao preflight OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Apenas POST é permitido
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { titulo, preco, quantidade, descricao, metodoPagamento } = req.body;

        // Define os métodos de pagamento baseado na escolha do usuário
        let excludedPaymentTypes = [];
        let defaultPaymentMethodId = null;

        if (metodoPagamento === 'pix') {
            excludedPaymentTypes = [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'ticket' },
                { id: 'prepaid_card' }
            ];
            defaultPaymentMethodId = 'pix';
        } else if (metodoPagamento === 'cartao') {
            excludedPaymentTypes = [
                { id: 'ticket' },
                { id: 'bank_transfer' },
                { id: 'prepaid_card' }
            ];
        } else if (metodoPagamento === 'boleto') {
            excludedPaymentTypes = [
                { id: 'credit_card' },
                { id: 'debit_card' },
                { id: 'bank_transfer' },
                { id: 'prepaid_card' }
            ];
        }

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
            back_urls: {
                success: 'https://quemsoueusemmeusirmaos.com/pagamento-sucesso.html',
                failure: 'https://quemsoueusemmeusirmaos.com/pagamento-erro.html',
                pending: 'https://quemsoueusemmeusirmaos.com/pagamento-pendente.html'
            },
            auto_return: 'approved',
            statement_descriptor: 'QSESMI'
        };

        if (defaultPaymentMethodId) {
            preferenceData.payment_methods.default_payment_method_id = defaultPaymentMethodId;
        }

        // Cria a preferência usando o SDK correto
        const response = await mercadopago.preferences.create(preferenceData);

        console.log('Preferência criada:', response.body.id);

        res.status(200).json({
            id: response.body.id,
            init_point: response.body.init_point
        });

    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({
            error: 'Erro ao criar preferência',
            details: error.message
        });
    }
};
