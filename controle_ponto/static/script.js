document.addEventListener("DOMContentLoaded", function () {
    const tabelaPonto = document.getElementById("tabela-ponto");
    const mesSelect = document.getElementById("mes");

    function gerarTabela(mes) {
        tabelaPonto.innerHTML = "";
        const diasNoMes = new Date(2024, mes, 0).getDate();

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const data = new Date(2024, mes - 1, dia);
            const diaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()];

            const linha = document.createElement("tr");
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
            const entrada = row.querySelector(".entrada").value;
            const saida = row.querySelector(".saida").value;
            const diaSemana = row.cells[1].textContent;

            if (!entrada || !saida) return;

            const [hEntrada, mEntrada] = entrada.split(":").map(Number);
            const [hSaida, mSaida] = saida.split(":").map(Number);
            const minutosEntrada = hEntrada * 60 + mEntrada;
            const minutosSaida = hSaida * 60 + mSaida;
            const minutosTrabalhados = minutosSaida - minutosEntrada;

            const jornadaPadrao = 9 * 60 + 48; // 588 minutos
            let saldo = minutosTrabalhados - jornadaPadrao;

            if (diaSemana === "Sáb") {
                // Crédito do período total com 50% extra
                totalCredito += minutosTrabalhados * 1.5;
                bancoHoras += minutosTrabalhados * 1.5;
            } else if (diaSemana === "Dom") {
                // Crédito do período total com 100% extra
                totalCredito += minutosTrabalhados * 2;
                bancoHoras += minutosTrabalhados * 2;
            } else {
                // Dias úteis com regra de tolerância
                if (minutosEntrada >= 380 && minutosEntrada <= 519) { // 06:20 a 08:39
                    if (saldo >= 10) {
                        // saldo permanece como está
                    } else if (saldo >= 1 && saldo < 10) {
                        saldo = 0;
                    } else if (saldo <= -10) {
                        // saldo permanece como está
                    } else if (saldo < 0 && saldo > -10) {
                        saldo = 0;
                    }
                }

                if (saldo > 0) {
                    totalCredito += saldo;
                } else if (saldo < 0) {
                    totalDebito += Math.abs(saldo);
                }

                bancoHoras += saldo;
            }
        });

        document.getElementById("total-credit").textContent = formatarTempo(totalCredito);
        document.getElementById("total-debit").textContent = formatarTempo(totalDebito);
        document.getElementById("bank-hours").textContent = formatarTempo(bancoHoras);
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
