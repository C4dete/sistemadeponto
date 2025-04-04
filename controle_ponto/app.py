from flask import Flask, render_template, request, redirect, session
import json
import os

app = Flask(__name__)
app.secret_key = 'chave-secreta-muito-forte'

# Usuários simulados
USERS = {
    'admin': '1234',
    'joao': 'senha'
}

# Arquivo local para armazenar o histórico de horas
HISTORICO_FILE = 'historico_horas.json'

def carregar_historico():
    if os.path.exists(HISTORICO_FILE):
        with open(HISTORICO_FILE, 'r') as f:
            return json.load(f)
    return {}

def salvar_historico(data):
    with open(HISTORICO_FILE, 'w') as f:
        json.dump(data, f)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form['username']
        pw = request.form['password']
        if user in USERS and USERS[user] == pw:
            session['username'] = user
            return redirect('/home')
        else:
            return render_template('login.html', error='Usuário ou senha inválidos.')
    return render_template('login.html')

@app.route('/home', methods=['GET', 'POST'])
def home():
    if 'username' not in session:
        return redirect('/login')

    historico = carregar_historico()
    username = session['username']
    
    if request.method == 'POST':
        valor = request.form.get('historico')
        if valor:
            minutos = converter_para_minutos(valor)
            historico[username] = minutos  # salva como inteiro (minutos)
            salvar_historico(historico)
            return redirect('/ponto')  # redireciona após salvar

    # Caso contrário, exibe o valor atual (convertido para hh:mm)
    minutos = historico.get(username, 0)
    if isinstance(minutos, str) and ':' in minutos:
        minutos = converter_para_minutos(minutos)

    return render_template('home.html', usuario=username, historico=converter_para_horas(int(minutos)))

@app.route('/ponto')
def ponto():
    if 'username' not in session:
        return redirect('/login')

    historico = carregar_historico()
    username = session['username']
    horas_historico = historico.get(username, 0)

    if isinstance(horas_historico, str) and ':' in horas_historico:
        minutos = converter_para_minutos(horas_historico)
        acumulado = converter_para_horas(minutos)
    elif isinstance(horas_historico, int):
        acumulado = converter_para_horas(horas_historico)
    else:
        acumulado = '00:00'

    return render_template('ponto.html', usuario=username, horas_historico=acumulado)


@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect('/login')

@app.route('/')
def index():
    if 'username' in session:
        return redirect('/home')
    return redirect('/login')

def converter_para_minutos(hhmm):
    partes = hhmm.strip().split(':')
    horas = int(partes[0])
    minutos = int(partes[1])
    return horas * 60 + minutos

def converter_para_horas(minutos):
    horas = minutos // 60
    mins = minutos % 60
    return f'{horas:02d}:{mins:02d}'

if __name__ == '__main__':
    app.run(debug=True)
