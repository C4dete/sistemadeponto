document.addEventListener("DOMContentLoaded", function () {
    const tabelaPonto = document.getElementById("tabela-ponto");
    const mesSelect = document.getElementById("mes");

    const tolerancia = 10; // minutos de tolerância configurável

    function gerarTabela(mes) {
        tabelaPonto.innerHTML = "";
        const diasNoMes = new Date(2024, mes, 0).getDate();

        const cabecalho = document.createElement("tr");
        cabecalho.innerHTML = `
            <th>Dia</th>
            <th>Semana</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Ação</th>
        `;
        tabelaPonto.appendChild(cabecalho);

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const data = new Date(2024, mes - 1, dia);
            const diaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()];

            const linha = document.createElement("tr");
            if (diaSemana === "Sáb") linha.classList.add("sabado");
            if (diaSemana === "Dom") linha.classList.add("domingo");

            linha.innerHTML = `
                <td>${dia}</td>
                <td>${diaSemana}</td>
                <td><input type="time" class="entrada"></td>
                <td><input type="time" class="saida"></td>
                <td><button class="hp-button">HP</button></td>
            `;
            tabelaPonto.appendChild(linha);
        }

        adicionarEventos();
    }

    function adicionarEventos() {
        document.querySelectorAll(".hp-button").forEach((botao, index) => {
            botao.addEventListener("click", () => {
                document.querySelectorAll(".entrada")[index].value = "07:30";
                document.querySelectorAll(".saida")[index].value = "17:18";
                calcularResumo();
            });
        });

        document.querySelectorAll(".entrada, .saida").forEach(input => {
            input.addEventListener("input", calcularResumo);
        });
    }

    function calcularResumo() {
        let totalCredito = 0;
        let totalDebito = 0;
        let bancoHoras = 0;

        document.querySelectorAll("#tabela-ponto tr").forEach(row => {
            const entrada = row.querySelector(".entrada")?.value;
            const saida = row.querySelector(".saida")?.value;
            const diaSemana = row.cells[1]?.textContent;

            if (!entrada || !saida) return;

            const [hEntrada, mEntrada] = entrada.split(":").map(Number);
            const [hSaida, mSaida] = saida.split(":").map(Number);
            const minutosEntrada = hEntrada * 60 + mEntrada;
            const minutosSaida = hSaida * 60 + mSaida;
            const minutosTrabalhados = minutosSaida - minutosEntrada;

            const jornadaPadrao = 9 * 60 + 48;
            let saldo = minutosTrabalhados - jornadaPadrao;

            if (diaSemana === "Sáb") {
                totalCredito += minutosTrabalhados * 1.5;
                bancoHoras += minutosTrabalhados * 1.5;
                return;
            }

            if (diaSemana === "Dom") {
                totalCredito += minutosTrabalhados * 2;
                bancoHoras += minutosTrabalhados * 2;
                return;
            }

            if (minutosEntrada >= 380 && minutosEntrada <= 519) {
                if (saldo >= 1 && saldo <= tolerancia) saldo = 0;
                if (saldo >= -tolerancia && saldo <= -1) saldo = 0;
            }

            if (saldo > 0) totalCredito += saldo;
            else if (saldo < 0) totalDebito += Math.abs(saldo);

            bancoHoras += saldo;
        });

        const historicoElement = document.getElementById("historico-horas");
        const historicoMinutos = historicoElement
            ? parseInt(historicoElement.textContent.split(":")[0]) * 60 +
              parseInt(historicoElement.textContent.split(":")[1])
            : 0;

        const bancoFinal = bancoHoras + historicoMinutos;

        document.getElementById("total-credit").textContent = formatarTempo(totalCredito);
        document.getElementById("total-debit").textContent = formatarTempo(totalDebito);
        document.getElementById("bank-hours").textContent = formatarTempo(bancoHoras);
        document.getElementById("total-final").textContent = formatarTempo(bancoFinal);
    }

    function formatarTempo(minutos) {
        const sinal = minutos < 0 ? "-" : "";
        minutos = Math.abs(minutos);
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${sinal}${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    }

    mesSelect.addEventListener("change", () => gerarTabela(mesSelect.value));
    gerarTabela(mesSelect.value);
});
