from flask import Flask, render_template, request, redirect, session

app = Flask(__name__)
app.secret_key = 'chave-secreta-muito-forte'

# Simulação de usuários
USERS = {
    'admin': 'admin',
    'Cadete': 'admin'
}

# Página de login
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

# Página principal após login
@app.route('/home')
def home():
    if 'username' not in session:
        return redirect('/login')
    return render_template('home.html', usuario=session['username'])

# Página de ponto (só exemplo)
@app.route('/ponto')
def ponto():
    if 'username' not in session:
        return redirect('/login')
    return render_template('ponto.html')

# Logout
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect('/login')

# Redireciona '/' para login ou home
@app.route('/')
def index():
    if 'username' in session:
        return redirect('/home')
    return redirect('/login')

if __name__ == '__main__':
    app.run(debug=True)
