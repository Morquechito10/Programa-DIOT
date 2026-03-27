document.addEventListener('DOMContentLoaded', () => {
    const extraFieldsContainer = document.getElementById('extraFieldsContainer');
    const btnAdd = document.getElementById('btnAdd');
    const btnDownloadMasivo = document.getElementById('btnDownloadMasivo');
    const listaCuerpo = document.getElementById('listaCuerpo');
    const contador = document.getElementById('contador');
    const form = document.getElementById('diotForm');
    const rfcInput = document.getElementById('f2');

    let listaDIOT = [];

    for (let i = 0; i < 54; i++) {
        if (!document.getElementById(`f${i}`)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = `f${i}`;
            
            if (i === 53) {
                input.value = '01'; 
            } else if (i >= 7) {
                input.value = '0';  
            } else {
                input.value = '';
            }
            extraFieldsContainer.appendChild(input);
        }
    }

    rfcInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    btnAdd.addEventListener('click', () => {
        let registroFila = [];

        for (let i = 0; i < 54; i++) {
            const input = document.getElementById(`f${i}`);
            let valor = input ? input.value.trim().replace(/\|/g, "") : "";
            
            if (i === 53) {
                valor = "01"; 
            } else if (i >= 7 && valor === "") {
                valor = "0"; 
            }
            
            registroFila.push(valor);
        }

        const lineaTexto = registroFila.join('|');

        listaDIOT.push({
            textoFinal: lineaTexto,
            rfc: document.getElementById('f2').value || 'SIN RFC',
            tipo: document.getElementById('f0').value,
            operacion: document.getElementById('f1').value,
            iva16: document.getElementById('f11').value 
        });

        actualizarTabla();
        form.reset(); 
        
        document.getElementById('f11').value = '0';
        document.getElementById('f7').value = '0';
        document.getElementById('f48').value = '0';
        document.getElementById('f50').value = '0';
        
        document.getElementById('f0').focus();
    });

    function actualizarTabla() {
        listaCuerpo.innerHTML = '';
        
        listaDIOT.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.rfc}</strong></td>
                <td>${item.tipo}</td>
                <td>${item.operacion}</td>
                <td>$${item.iva16}</td>
                <td><button type="button" class="btn-delete" onclick="eliminarFila(${index})">Eliminar</button></td>
            `;
            listaCuerpo.appendChild(tr);
        });

        contador.textContent = listaDIOT.length;
        btnDownloadMasivo.disabled = listaDIOT.length === 0;
    }

    window.eliminarFila = function(index) {
        listaDIOT.splice(index, 1);
        actualizarTabla();
    };

    btnDownloadMasivo.addEventListener('click', () => {
        if (listaDIOT.length === 0) return;

        const lineas = listaDIOT.map(item => item.textoFinal);
        const contenidoTxt = lineas.join('\r\n');

        const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `DIOT_CARGA_MASIVA_${listaDIOT.length}_REGISTROS.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
});