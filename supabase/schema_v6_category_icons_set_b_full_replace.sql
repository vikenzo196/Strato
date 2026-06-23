-- =====================================================================
-- STRATO · migrazione v6
-- Reimposta le categorie esistenti sulle chiavi canoniche del Set B.
--
-- Idempotente. Aggiorna solo public.categories.icon.
-- Da eseguire dopo il deploy della patch v2cf.
-- =====================================================================

begin;

update public.categories
set icon = case
  when lower(name) similar to '%(luce|lampad)%' then 'l_tavolo'
  when lower(name) similar to '%(forme|vasi|vaso|anfora)%' then 'v_classico'
  when lower(name) similar to '%orologi? da tavolo%' then 'o_quadrante'
  when lower(name) similar to '%orologi? da parete%' then 'o_parete'
  when lower(name) similar to '%(tempo|orologi?|sveglia|clessidra)%' then 'o_parete'
  when lower(name) similar to '%(arredo|sedie|sedia|poltrone|poltrona|tavoli|tavolo|librerie|libreria)%' then 'a_poltrona'
  when lower(name) similar to '%(contenere|contenitori|contenitore|scatole|scatola|cesti|cesto|barattoli|barattolo|portapenne)%' then 'c_scatola'
  when lower(name) similar to '%(parete|mensole|mensola|ganci|gancio|cornici|cornice)%' then 'p_mensola'
  when lower(name) similar to '%(scrivania|studio|desk|portaoggetti|fermacarte|leggio)%' then 's_scrivania'
  when lower(name) similar to '%(tavola|tazze|tazza|vassoi|vassoio|ciotole|ciotola|piatti|piatto)%' then 't_vassoio'
  when lower(name) similar to '%(decoro|decorazioni|decorazione|fiore|fiori|stella|stelle|cuore|cuori)%' then 'd_fiore'
  when lower(name) similar to '%(stagionali|stagionale|candela|candele|albero|alberi|pallina|palline|fiocco|fiocchi|natale)%' then 'st_candela'
  when lower(name) similar to '%(altro|accessori|accessorio|cubo|sfera|geometr)%' then 'altro_cubo'
  when icon in ('vaso','v_ampolla','v_tubo','v_anfora','v_conico') then 'v_classico'
  when icon in ('lampada','l_tavolo','l_sospensione','l_piantana','l_comodino','l_lampadina') then 'l_tavolo'
  when icon in ('o_parete','o_sveglia','o_clessidra','o_quadrante') then icon
  when icon in ('a_sedia','a_poltrona','a_tavolo','a_libreria','a_armadio') then icon
  when icon in ('scatola','c_scatola','c_cestino','c_barattolo','c_portapenne','c_ciotola','borsa') then 'c_scatola'
  when icon in ('p_mensola','p_gancio','d_cornice') then icon
  when icon in ('s_scrivania','s_supporto','s_fermacarte','s_leggio') then icon
  when icon in ('tazza','t_vassoio','t_sottopiatto') then icon
  when icon in ('fiore','d_fiore','d_stella','d_cuore','d_fiocco','stella','regalo') then 'd_fiore'
  when icon in ('st_candela','st_albero','st_ornamento') then icon
  when icon in ('gemma','fulmine','altro_cubo','altro_sfera','altro_geo','acc_portachiavi','acc_stand') then 'altro_cubo'
  else icon
end;

commit;
