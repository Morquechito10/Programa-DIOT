document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const btnAdd = document.getElementById('btnAdd');
    const btnPreview = document.getElementById('btnPreview');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modal = document.getElementById('satModal');
    const rfcInput = document.getElementById('f2');
    const errorBox = document.getElementById('errorBox');
    
    let listaDIOT = [];

    // ==========================================
    // MAPA EXACTO DE COLUMNAS (54 POSICIONES)
    // ==========================================
    // *AQUÍ DEBES AJUSTAR LOS NÚMEROS CUANDO TENGAS EL MANUAL OFICIAL DEL SAT*
    const MAPA = {
        TIPO_TERCERO: 0,
        TIPO_OPERACION: 1,
        RFC: 2,
        BASE_16: 11,      // Valor Bruto al 16%
        DTO_16: 12,       // Descuento al 16%
        // Estos son los que el SAT movió. (Los pongo en 30 y 31 como ejemplo)
        IVA_EXCLUSIVO_16: 30, 
        IVA_PROPORCION_16: 31,
        EFECTOS_FISCALES: 53  // Última posición (Obligatorio '01')
    };

    // Formatear RFC y calcular IVA en vivo
    rfcInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    ['f11', 'f12'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const bruto16 = parseFloat(document.getElementById('f11').value) || 0;
            const dto16 = parseFloat(document.getElementById('f12').value) || 0;
            const neto16 = Math.max(0, bruto16 - dto16);
            document.getElementById('ivaVisual').value = `$${Math.round(neto16 * 0.16)}`;
        });
    });

    // ==========================================
    // LÓGICA DEL SIMULADOR SAT
    // ==========================================
    btnPreview.addEventListener('click', () => {
        const bruto16 = Math.round(parseFloat(document.getElementById('f11').value) || 0);
        const dto16 = Math.round(parseFloat(document.getElementById('f12').value) || 0);
        
        if(dto16 > bruto16) {
            alert("Error: El descuento no puede ser mayor al valor bruto.");
            return;
        }

        const neto16 = bruto16 - dto16;
        const iva16 = Math.round(neto16 * 0.16);
        const acreditamiento = document.getElementById('tipoAcreditamiento').value;

        // Llenar Pestaña 1 (Valores)
        document.getElementById('sat_bruto16').value = bruto16.toLocaleString();
        document.getElementById('sat_dto16').value = dto16.toLocaleString();
        document.getElementById('sat_neto16').value = neto16.toLocaleString();
        document.getElementById('sat_iva_pagado16').value = iva16.toLocaleString();

        // Llenar Pestaña 2 (Acreditamiento)
        document.getElementById('sat_iva_exclusivo').value = (acreditamiento === 'exclusivo') ? iva16.toLocaleString() : '0';
        document.getElementById('sat_iva_prop').value = (acreditamiento === 'proporcion') ? iva16.toLocaleString() : '0';
        document.getElementById('sat_iva_total').value = (acreditamiento !== 'no_acreditable') ? iva16.toLocaleString() : '0';

        // Mostrar Modal
        modal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => { modal.style.display = 'none'; });

    // Cambiar pestañas en el simulador
    document.getElementById('tab1').addEventListener('click', function() {
        this.classList.add('active'); document.getElementById('tab2').classList.remove('active');
        document.getElementById('satView1').style.display = 'block';
        document.getElementById('satView2').style.display = 'none';
    });
    document.getElementById('tab2').addEventListener('click', function() {
        this.classList.add('active'); document.getElementById('tab1').classList.remove('active');
        document.getElementById('satView2').style.display = 'block';
        document.getElementById('satView1').style.display = 'none';
    });

    // ==========================================
    // GENERACIÓN DEL TXT
    // ==========================================
    btnAdd.addEventListener('click', () => {
        const bruto16 = Math.round(parseFloat(document.getElementById('f11').value) || 0);
        const dto16 = Math.round(parseFloat(document.getElementById('f12').value) || 0);
        
        if (dto16 > bruto16 || rfcInput.value.length < 12) {
            errorBox.innerHTML = "Por favor verifica el RFC (12-13 caracteres) y que el Descuento no supere al Bruto.";
            errorBox.style.display = "block";
            return;
        }

        const neto16 = bruto16 - dto16;
        const ivaCalculado = Math.round(neto16 * 0.16);
        const acreditamiento = document.getElementById('tipoAcreditamiento').value;

        // Inicializar arreglo de 54 vacíos
        let registroTxt = new Array(54).fill("");

        // Llenar datos básicos
        registroTxt[MAPA.TIPO_TERCERO] = document.getElementById('f0').value;
        registroTxt[MAPA.TIPO_OPERACION] = document.getElementById('f1').value;
        registroTxt[MAPA.RFC] = rfcInput.value;
        
        // Llenar Montos Base y Descuentos
        registroTxt[MAPA.BASE_16] = bruto16.toString();
        registroTxt[MAPA.DTO_16] = dto16.toString();

        // Llenar IVA Acreditable según selección (Desplazado para evitar error del SAT)
        if (acreditamiento === 'exclusivo') {
            registroTxt[MAPA.IVA_EXCLUSIVO_16] = ivaCalculado.toString();
        } else if (acreditamiento === 'proporcion') {
            registroTxt[MAPA.IVA_PROPORCION_16] = ivaCalculado.toString();
        }

        // Llenar ceros obligatorios en campos de monto vacíos y código final
        for (let i = 7; i < 53; i++) {
            if (registroTxt[i] === "") registroTxt[i] = "0";
        }
        registroTxt[MAPA.EFECTOS_FISCALES] = "01";

        listaDIOT.push({
            textoFinal: registroTxt.join('|'),
            rfc: rfcInput.value,
            bruto: bruto16,
            dto: dto16,
            iva: ivaCalculado
        });

        // Actualizar UI
        document.getElementById('f11').value = '0';
        document.getElementById('f12').value = '0';
        document.getElementById('ivaVisual').value = '$0';
        errorBox.style.display = "none";
        
        // Refrescar tabla inferior
        const listaCuerpo = document.getElementById('listaCuerpo');
        listaCuerpo.innerHTML = '';
        listaDIOT.forEach((item, index) => {
            listaCuerpo.innerHTML += `<tr>
                <td>${item.rfc}</td><td>$${item.bruto}</td><td>-$${item.dto}</td><td>$${item.iva}</td>
                <td><button onclick="eliminarFila(${index})">Eliminar</button></td>
            </tr>`;
        });
        document.getElementById('contador').textContent = listaDIOT.length;
        document.getElementById('btnDownloadMasivo').disabled = false;
    });

    window.eliminarFila = function(index) {
        listaDIOT.splice(index, 1);
        document.getElementById('contador').textContent = listaDIOT.length;
        if(listaDIOT.length === 0) document.getElementById('btnDownloadMasivo').disabled = true;
        btnAdd.click(); // Hack para redibujar la tabla
    };

    document.getElementById('btnDownloadMasivo').addEventListener('click', () => {
        const contenidoTxt = listaDIOT.map(item => item.textoFinal).join('\r\n');
        const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `DIOT_EXPERT_54CAMPOS.txt`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });
});