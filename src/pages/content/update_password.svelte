<script>
     import {user} from '../../store';
     import {get} from 'svelte/store';
     import api from '../../api';
    let MostrarEditar;
    let paswordBefore;
    let passwordNew;
    let passwordNewRepeat;
    let mensaje="";
    let exitoUpdate=false;
    $: islength =false;
    $: isNumber =false;
    $: isSpace =false;
    $: isEquals =false;
    $: isEquals =false;
    $: isEqualsPassword =passwordNew==passwordNewRepeat;
    $: isEqualsPasswordBefore =paswordBefore==$user.password;
    function change(e){
    let contadorNumeric=0;
    let contadorSpace=0;
    const valor=e.target.value;
    islength=valor.length > 7 ? true : false;
    for(var i=0;i< valor.length;i++){
        if(valor.charAt(i)==' '){
            contadorSpace++;
        }
        if(!isNaN(parseFloat(valor.charAt(i).trim())) && isFinite(valor.charAt(i).trim())){
            contadorNumeric++;
        }
    }
    isNumber=contadorNumeric > 0 ? true :false;
    isSpace=contadorSpace > 0 || valor.length==0  ? false:true;
    }

function handleSubmit(e){
    e.preventDefault();
    let team=get(user);
    api.user.reset({
        email: team.name,
        password: passwordNew
        }).then(response => response.data).then(result => {
            paswordBefore="";
            passwordNewRepeat="";
            passwordNew="";
            isEqualsPasswordBefore=false;
           exitoUpdate=true;
           mensaje="your password to modify successfully";
           setTimeout(()=>{
            exitoUpdate=false;
           },5000);
        }).catch(err => {
            console.log("error");
            exitoUpdate=false;
            mensaje="";
        })
    
}
    

</script>

<div class="contenedor_password">
<div class="contenedor_update">
    <div class="formulario_update">
        <h1 class="titulos">Update Password</h1> 
        <form on:submit={handleSubmit}>
            <div class="contenedor_campos">
                <label class="label_campo">Current password</label>
                <input type="text" class="texto_campo"  bind:value={paswordBefore}>
            </div>
            {#if isEqualsPasswordBefore == true }
            <div class="contenedor_campos">
                <label class="label_campo">New password</label>
                <input type="text" class="texto_campo" on:input={change} id="passwordNew" bind:value={passwordNew}>
            </div>
            <div class="contenedor_campos">
                <label class="label_campo">New password repeat</label>
                <input type="text" class="texto_campo" id="passwordNewRepeat" bind:value={passwordNewRepeat}>
            </div>
            <div class="enviar_update">
                <input type="submit" value="Update" class="formateo button">
            </div>
            {/if}
        </form>
    </div>
    <div class="instrucciones_update">
        <h1 class="titulos">You Password</h1>
        {#if exitoUpdate == false}
            
        <p>{#if isEqualsPasswordBefore==false}<i class="fa fa-check-square red"></i> {/if} {#if isEqualsPasswordBefore==true}<i class="fa fa-check-square verde"></i> {/if}Ingresa tu contraseña anterior</p>
        <p>{#if isEqualsPassword==false}<i class="fa fa-check-square red"></i> {/if} {#if isEqualsPassword==true}<i class="fa fa-check-square verde"></i> {/if}Verificar dos veces la contrasena a modificar</p>
        <p>{#if islength==false}<i class="fa fa-check-square red"></i> {/if} {#if islength==true}<i class="fa fa-check-square verde"></i> {/if}Tu contraseña debe tener siete o mas caracteres</p>
        <p>{#if isNumber==false}<i class="fa fa-check-square red"></i> {/if} {#if isNumber==true}<i class="fa fa-check-square verde"></i> {/if} tu contraseña debe contener almenos un numero</p>
        <p>{#if isSpace==false}<i class="fa fa-check-square red"></i> {/if} {#if isSpace==true}<i class="fa fa-check-square verde"></i> {/if}la contraseña no debe contener espacios</p>
        {:else}
        <p><i class="fa fa-check-square verde"></i>Contraseña modificada con exito</p>
        {/if}
    </div>
    
</div>
</div>
