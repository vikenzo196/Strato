-- =====================================================================
-- STRATO · migrazione v5
-- Allinea le categorie esistenti al nuovo sistema icone Set B.
--
-- Idempotente: può essere rieseguita.
-- Non elimina categorie e non modifica nomi/posizioni.
-- Aggiorna solo public.categories.icon.
-- =====================================================================

begin;

update public.categories
set icon = case
  -- Luce / lampade
  when lower(name) similar to '%(luce|lampad)%' then 'l_tavolo'

  -- Forme / vasi
  when lower(name) similar to '%(forme|vasi|vaso|anfora)%' then 'v_classico'

  -- Tempo / orologi
  when lower(name) similar to '%orologi? da tavolo%' then 'o_quadrante'
  when lower(name) similar to '%orologi? da parete%' then 'o_parete'
  when lower(name) similar to '%(tempo|orologi?|sveglia|clessidra)%' then 'o_parete'

  -- Arredo
  when lower(name) similar to '%(arredo|sedie|sedia|poltrone|poltrona|tavoli|tavolo|librerie|libreria)%' then 'a_poltrona'

  -- Contenere
  when lower(name) similar to '%(contenere|contenitori|contenitore|scatole|scatola|cesti|cesto|barattoli|barattolo|portapenne)%' then 'c_scatola'

  -- Parete
  when lower(name) similar to '%(parete|mensole|mensola|ganci|gancio|cornici|cornice)%' then 'p_mensola'

  -- Scrivania
  when lower(name) similar to '%(scrivania|studio|desk|portaoggetti|fermacarte|leggio)%' then 's_scrivania'

  -- Tavola
  when lower(name) similar to '%(tavola|tazze|tazza|vassoi|vassoio|ciotole|ciotola|piatti|piatto)%' then 't_vassoio'

  -- Decoro
  when lower(name) similar to '%(decoro|decorazioni|decorazione|fiore|fiori|stella|stelle|cuore|cuori)%' then 'd_fiore'

  -- Stagionali
  when lower(name) similar to '%(stagionali|stagionale|candela|candele|albero|alberi|pallina|palline|fiocco|fiocchi|natale)%' then 'st_candela'

  -- Altro
  when lower(name) similar to '%(altro|accessori|accessorio|cubo|sfera|geometr)%' then 'altro_cubo'

  -- Alias legacy per database già popolati
  when icon = 'vaso' then 'v_classico'
  when icon = 'lampada' then 'l_tavolo'
  when icon = 'scatola' then 'c_scatola'
  when icon = 'gemma' then 'altro_geo'
  when icon = 'stella' then 'd_stella'
  when icon = 'fulmine' then 'altro_geo'
  when icon = 'regalo' then 'd_fiocco'
  when icon = 'fiore' then 'd_fiore'
  when icon = 'borsa' then 'c_cestino'
  when icon = 'l_comodino' then 'l_tavolo'
  when icon = 'v_ampolla' then 'v_anfora'
  when icon = 'a_armadio' then 'a_libreria'
  when icon = 'c_ciotola' then 't_vassoio'

  else icon
end
where
  lower(name) similar to '%(luce|lampad|forme|vasi|vaso|anfora|tempo|orologi?|sveglia|clessidra|arredo|sedie|sedia|poltrone|poltrona|tavoli|tavolo|librerie|libreria|contenere|contenitori|contenitore|scatole|scatola|cesti|cesto|barattoli|barattolo|portapenne|parete|mensole|mensola|ganci|gancio|cornici|cornice|scrivania|studio|desk|portaoggetti|fermacarte|leggio|tavola|tazze|tazza|vassoi|vassoio|ciotole|ciotola|piatti|piatto|decoro|decorazioni|decorazione|fiore|fiori|stella|stelle|cuore|cuori|stagionali|stagionale|candela|candele|albero|alberi|pallina|palline|fiocco|fiocchi|natale|altro|accessori|accessorio|cubo|sfera|geometr)%'
  or icon in (
    'vaso','lampada','scatola','gemma','stella','fulmine','regalo','fiore','borsa',
    'l_comodino','v_ampolla','a_armadio','c_ciotola'
  );

commit;
